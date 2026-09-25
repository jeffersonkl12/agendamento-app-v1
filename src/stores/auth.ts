import {
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

	// O client do better-auth não lança exceção em falha: resolve com { data, error }.
	// Por isso não reaproveita @composables/useRequestState, que é baseado em try/catch pro axios.
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
		} finally {
			isLoading.value = false;
		}
	}

	async function signUp(input: SignUpEmailInput) {
		return run(() => signUpWithEmail(input));
	}

	async function signIn(input: SignInEmailInput) {
		return run(() => signInWithEmail(input));
	}

	async function signInGoogle() {
		return run(() => signInWithGoogle());
	}

	async function signOut() {
		return run(() => signOutUser());
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
		signUp,
		signIn,
		signInGoogle,
		signOut,
		forgotPassword,
		resetPassword,
	};
});
