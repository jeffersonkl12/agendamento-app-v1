import {
	getSession,
	requestPasswordReset as requestPasswordResetEmail,
	resetPassword as resetPasswordWithToken,
	type SignInEmailInput,
	type SignUpEmailInput,
	signInWithEmail,
	signInWithGoogle,
	signOut as signOutUser,
	signUpWithEmail,
	useSession,
} from "@services/auth";
import { defineStore } from "pinia";
import { ref } from "vue";

interface BetterAuthErrorLike {
	status?: number;
	message?: string;
}

// 429 (rate limit) e 403 (e-mail não verificado no login) têm mensagem própria por RN-AU06/§2;
// o resto usa a mensagem do better-auth (em inglês — traduzir aqui se algum outro caso virar UI).
function mapAuthErrorMessage(error: BetterAuthErrorLike): string {
	if (error.status === 429) return "Muitas tentativas. Tente novamente em instantes.";
	if (error.status === 403) {
		return "Confirme seu e-mail antes de entrar — reenviamos o link de verificação.";
	}
	return error.message ?? "Não foi possível completar a ação. Tente novamente.";
}

export const useAuthStore = defineStore("auth", () => {
	const session = useSession();
	const isLoading = ref(false);
	const error = ref<string | null>(null);

	// Fonte de verdade da guarda de rota. O atom do useSession se atualiza de forma assíncrona depois de
	// login/logout, o que gera corrida na navegação logo em seguida — por isso o estado é mantido aqui.
	const isAuthenticated = ref(false);
	const sessionChecked = ref(false);

	async function ensureSession(): Promise<boolean> {
		if (sessionChecked.value) return isAuthenticated.value;
		try {
			const { data } = await getSession();
			isAuthenticated.value = data !== null;
			sessionChecked.value = true;
		} catch {
			// Falha de rede lança em vez de resolver com { error } — sem isso a guarda de rota quebra
			// a navegação e a tela fica em branco. Trata como deslogado e tenta de novo na próxima rota.
			isAuthenticated.value = false;
		}
		return isAuthenticated.value;
	}

	function markSignedIn() {
		isAuthenticated.value = true;
		sessionChecked.value = true;
	}

	function clearSession() {
		isAuthenticated.value = false;
		sessionChecked.value = true;
	}

	// O client do better-auth não lança em erro HTTP: resolve com { data, error }. Por isso não reaproveita
	// @composables/useRequestState (try/catch pro axios). Falha de rede, porém, lança — tratada no catch.
	async function run<T>(
		fn: () => Promise<{ data: T | null; error: BetterAuthErrorLike | null }>,
	): Promise<T | null> {
		isLoading.value = true;
		error.value = null;
		try {
			const result = await fn();
			if (result.error) {
				error.value = mapAuthErrorMessage(result.error);
				return null;
			}
			return result.data;
		} catch {
			error.value = "Sem conexão com o servidor. Verifique sua internet.";
			return null;
		} finally {
			isLoading.value = false;
		}
	}

	async function signUp(input: SignUpEmailInput) {
		return run(() => signUpWithEmail(input));
	}

	async function signIn(input: SignInEmailInput) {
		const result = await run(() => signInWithEmail(input));
		if (result) markSignedIn();
		return result;
	}

	async function signInGoogle(callbackURL: string) {
		return run(() => signInWithGoogle(callbackURL));
	}

	async function signOut() {
		const result = await run(() => signOutUser());
		if (result) clearSession();
		return result;
	}

	async function forgotPassword(email: string, redirectTo?: string) {
		return run(() => requestPasswordResetEmail(email, redirectTo));
	}

	async function resetPassword(newPassword: string, token: string) {
		return run(() => resetPasswordWithToken(newPassword, token));
	}

	return {
		session,
		isLoading,
		error,
		isAuthenticated,
		ensureSession,
		clearSession,
		signUp,
		signIn,
		signInGoogle,
		signOut,
		forgotPassword,
		resetPassword,
	};
});
