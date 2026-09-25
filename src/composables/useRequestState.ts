import { getApiErrorMessage } from "@services/http";
import { ref } from "vue";

export interface RunOptions {
	/** Retorna `true` pra suprimir o `error` da store (ex.: 404 esperado em rotas `/me`). */
	onError?: (error: unknown) => boolean;
}

/**
 * Plumbing compartilhada pelas stores de domínio: isLoading/error em volta de uma chamada de service.
 * Não é regra de negócio — fica em @composables por convenção (usa refs), mas é infraestrutura técnica.
 */
export function useRequestState() {
	const isLoading = ref(false);
	const error = ref<string | null>(null);

	async function run<T>(fn: () => Promise<T>, options?: RunOptions): Promise<T | undefined> {
		isLoading.value = true;
		error.value = null;
		try {
			return await fn();
		} catch (err) {
			const suppressed = options?.onError?.(err) ?? false;
			if (!suppressed) {
				error.value = getApiErrorMessage(err);
			}
			return undefined;
		} finally {
			isLoading.value = false;
		}
	}

	return { isLoading, error, run };
}
