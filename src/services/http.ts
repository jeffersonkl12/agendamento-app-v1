import { resolveApiBaseUrl } from "@libs/api-base-url";
import { router } from "@routers/index";
import { useAuthStore } from "@stores/auth";
import type { AxiosError } from "axios";
import axios from "axios";

const apiRootUrl = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

// Recursos de domínio vivem sob /api/v1 (back-api.md §5); sem o prefixo a rota retorna 404.
export const http = axios.create({
	baseURL: `${apiRootUrl}/api/v1`,
	withCredentials: true,
});

// Rotas fora do /api/v1 que o painel consome (conexão do WhatsApp, back-api.md §4).
export const rootHttp = axios.create({
	baseURL: apiRootUrl,
	withCredentials: true,
});

export interface ApiErrorIssue {
	code?: string;
	path: (string | number)[];
	message: string;
}

export interface ApiErrorBody {
	error: string;
	issues?: ApiErrorIssue[];
}

function redirectToLoginOnUnauthorized(error: AxiosError<ApiErrorBody>) {
	// O 401 do middleware é text/plain (back-api.md §3): só o status é lido, nunca o corpo.
	// A sessão é invalidada antes, senão a guarda de rota ainda acha que o usuário está logado
	// e devolve pra "/".
	if (error.response?.status === 401) {
		useAuthStore().clearSession();
		const current = router.currentRoute.value;
		// Várias chamadas em paralelo podem devolver 401 ao mesmo tempo (ex.: sessão expirada
		// com a página disparando várias buscas no mount). Sem essa guarda, cada uma empurra um
		// novo /login?redirect=... usando o fullPath atual — que já pode ser o /login da chamada
		// anterior — aninhando o redirect indefinidamente.
		if (current.path !== "/login") {
			router.push({ path: "/login", query: { redirect: current.fullPath } });
		}
	}
	return Promise.reject(error);
}

for (const client of [http, rootHttp]) {
	client.interceptors.response.use((response) => response, redirectToLoginOnUnauthorized);
}

const DEFAULT_ERROR_MESSAGE = "Não foi possível completar a ação. Tente novamente.";

// A API devolve mensagens em inglês (back-api.md §3) — o painel mostra texto em PT-BR mapeado por
// status. Casos específicos (409 de telefone duplicado, horário ocupado…) são refinados nos composables.
const ERROR_MESSAGE_BY_STATUS: Record<number, string> = {
	400: "Dados inválidos. Revise as informações e tente novamente.",
	404: "Não encontramos esse registro. Atualize a página.",
	409: "Essa ação não é possível: já existe um registro igual ou ele está em uso.",
	422: "Essa operação não é permitida para o estado atual do registro.",
	429: "Muitas tentativas. Tente novamente em instantes.",
};

export function getApiErrorMessage(error: unknown): string {
	if (!axios.isAxiosError<ApiErrorBody>(error)) return DEFAULT_ERROR_MESSAGE;
	if (!error.response) return "Sem conexão com o servidor. Verifique sua internet.";
	return ERROR_MESSAGE_BY_STATUS[error.response.status] ?? DEFAULT_ERROR_MESSAGE;
}

export function getApiErrorStatus(error: unknown): number | null {
	return axios.isAxiosError(error) ? (error.response?.status ?? null) : null;
}

/** Erros de validação (400) por campo: `issues[].path[0]` → mensagem, pra marcar o campo do formulário. */
export function getApiFieldErrors(error: unknown): Record<string, string> {
	if (!axios.isAxiosError<ApiErrorBody>(error)) return {};
	const fieldErrors: Record<string, string> = {};
	for (const issue of error.response?.data?.issues ?? []) {
		const field = issue.path[0];
		if (field !== undefined && !(String(field) in fieldErrors)) {
			fieldErrors[String(field)] = issue.message;
		}
	}
	return fieldErrors;
}
