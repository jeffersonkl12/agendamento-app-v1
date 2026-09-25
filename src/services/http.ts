import { router } from "@routers/index";
import { useAuthStore } from "@stores/auth";
import type { AxiosError } from "axios";
import axios from "axios";

export const http = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	withCredentials: true,
});

export interface ApiErrorIssue {
	path: (string | number)[];
	message: string;
}

export interface ApiErrorBody {
	error: string;
	issues?: ApiErrorIssue[];
}

http.interceptors.response.use(
	(response) => response,
	(error: AxiosError<ApiErrorBody>) => {
		// RN-AU06: 401 em qualquer chamada do painel volta pro login. A sessão é invalidada antes,
		// senão a guarda de rota ainda acha que o usuário está logado e devolve pra "/".
		if (error.response?.status === 401) {
			useAuthStore().clearSession();
			router.push({ path: "/login", query: { redirect: router.currentRoute.value.fullPath } });
		}
		return Promise.reject(error);
	},
);

const DEFAULT_ERROR_MESSAGE = "Não foi possível completar a ação. Tente novamente.";

// A API devolve mensagens em inglês (§12#11) — o painel mostra texto em PT-BR mapeado por status.
// Casos específicos (409 ao cancelar, 500 ao excluir modelo) são refinados nos composables.
const ERROR_MESSAGE_BY_STATUS: Record<number, string> = {
	400: "Dados inválidos. Revise as informações e tente novamente.",
	404: "Não encontramos esse registro. Atualize a página.",
	409: "Essa ação não é mais possível — os dados mudaram. Atualize a página.",
	429: "Muitas tentativas. Tente novamente em instantes.",
};

export function getApiErrorMessage(error: unknown): string {
	if (!axios.isAxiosError<ApiErrorBody>(error)) return DEFAULT_ERROR_MESSAGE;
	if (!error.response) return "Sem conexão com o servidor. Verifique sua internet.";
	return ERROR_MESSAGE_BY_STATUS[error.response.status] ?? DEFAULT_ERROR_MESSAGE;
}

// GET /<recurso>/me devolve 404 quando o recurso ainda não existe (dashboard-api-routes.md §1.3) —
// é um estado válido, não um erro; as stores usam isso pra não sinalizar erro nesse caso.
export function isNotFoundError(error: unknown): boolean {
	return getApiErrorStatus(error) === 404;
}

export function getApiErrorStatus(error: unknown): number | null {
	return axios.isAxiosError(error) ? (error.response?.status ?? null) : null;
}
