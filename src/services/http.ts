import { router } from "@routers/index";
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
		if (error.response?.status === 401) {
			router.push("/login");
		}
		return Promise.reject(error);
	},
);

export function getApiErrorMessage(error: unknown): string {
	if (axios.isAxiosError<ApiErrorBody>(error) && error.response?.data?.error) {
		return error.response.data.error;
	}
	return "Não foi possível completar a ação. Tente novamente.";
}

// GET /<recurso>/me devolve 404 quando o recurso ainda não existe (dashboard-api-routes.md §1.3) —
// é um estado válido, não um erro; as stores usam isso pra não sinalizar erro nesse caso.
export function isNotFoundError(error: unknown): boolean {
	return axios.isAxiosError(error) && error.response?.status === 404;
}
