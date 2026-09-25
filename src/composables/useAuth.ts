import type { SignInEmailInput, SignUpEmailInput } from "@services/auth";
import { useAuthStore } from "@stores/auth";
import { computed } from "vue";

// RN-AU04: recuperação de senha sempre devolve a mesma mensagem de sucesso, exista ou não o e-mail —
// o composable não revela se o cadastro existe, mesmo a API já garantindo isso no back.
const REQUEST_RESET_SUCCESS_MESSAGE =
	"Se este e-mail estiver cadastrado, você vai receber um link de redefinição de senha.";

export interface RequestPasswordResetResult {
	success: boolean;
	message: string;
}

/**
 * Regra de negócio de autenticação (dashboard-api-routes.md §2) por cima da store de sessão:
 * estado derivado (usuário atual, autenticado ou não) e a mensagem única de recuperação de senha.
 */
export function useAuth() {
	const store = useAuthStore();

	const currentUser = computed(() => store.session.data?.user ?? null);
	const isAuthenticated = computed(() => store.session.data !== null);
	const isSessionLoading = computed(() => store.session.isPending);

	async function signUp(input: SignUpEmailInput) {
		const user = await store.signUp(input);
		// Cadastro não loga automaticamente (§2): sucesso aqui significa "mostrar tela de verificação de e-mail".
		return { user, requiresEmailVerification: user !== null };
	}

	async function signIn(input: SignInEmailInput) {
		return store.signIn(input);
	}

	async function signInWithGoogle() {
		return store.signInGoogle();
	}

	async function signOut() {
		return store.signOut();
	}

	async function requestPasswordReset(
		email: string,
		redirectTo?: string,
	): Promise<RequestPasswordResetResult> {
		await store.forgotPassword(email, redirectTo);
		if (store.error) {
			return { success: false, message: store.error };
		}
		return { success: true, message: REQUEST_RESET_SUCCESS_MESSAGE };
	}

	async function resetPassword(newPassword: string, token: string) {
		return store.resetPassword(newPassword, token);
	}

	return {
		currentUser,
		isAuthenticated,
		isSessionLoading,
		isLoading: computed(() => store.isLoading),
		error: computed(() => store.error),
		signUp,
		signIn,
		signInWithGoogle,
		signOut,
		requestPasswordReset,
		resetPassword,
	};
}
