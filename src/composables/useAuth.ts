import type { SignInEmailInput, SignUpEmailInput } from "@services/auth";
import { useAppointmentStore } from "@stores/appointment";
import { useAppointmentTemplateStore } from "@stores/appointment-template";
import { useAuthStore } from "@stores/auth";
import { useCustomerStore } from "@stores/customer";
import { useQuestionOptionStore } from "@stores/question-option";
import { useSchedulingConfigStore } from "@stores/scheduling-config";
import { useTemplateQuestionStore } from "@stores/template-question";
import { useUserStore } from "@stores/user";
import { useWhatsappStore } from "@stores/whatsapp";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

// RN-AU04: recuperação de senha sempre devolve a mesma mensagem de sucesso, exista ou não o e-mail —
// o composable não revela se o cadastro existe, mesmo a API já garantindo isso no back.
const REQUEST_RESET_SUCCESS_MESSAGE =
	"Se este e-mail estiver cadastrado, você vai receber um link de redefinição de senha.";

const SIGN_UP_SUCCESS_MESSAGE =
	"Conta criada! Enviamos um link de verificação para o seu e-mail — confirme antes de entrar.";

const VERIFICATION_RESENT_MESSAGE = "Reenviamos o link de verificação. Confira seu e-mail.";

const INVALID_RESET_TOKEN_MESSAGE =
	"Este link de redefinição é inválido ou expirou. Solicite um novo.";

export interface AuthActionResult {
	success: boolean;
	message: string | null;
}

function appUrl(path: string): string {
	return new URL(path, window.location.origin).toString();
}

/** Aceita só caminho interno ("/agenda") como destino pós-login — evita open redirect via query. */
function resolveRedirect(redirect: unknown): string {
	if (typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//")) {
		return redirect;
	}
	return "/";
}

/**
 * Regra de negócio de autenticação (back-api.md §2) por cima da store de sessão:
 * estado derivado, navegação pós-login/logout, mensagens únicas e limpeza das stores no logout.
 */
export function useAuth() {
	const store = useAuthStore();
	const router = useRouter();
	const route = useRoute();

	const currentUser = computed(() => store.session.data?.user ?? null);

	async function signUp(input: Omit<SignUpEmailInput, "callbackURL">): Promise<AuthActionResult> {
		// O link do e-mail abre a sessão sozinho (autoSignInAfterVerification) e cai no painel.
		const user = await store.signUp({ ...input, callbackURL: appUrl("/") });
		if (!user) return { success: false, message: store.error };
		// Cadastro não abre sessão (token null — §2.1): o usuário precisa verificar o e-mail.
		await router.push("/login");
		return { success: true, message: SIGN_UP_SUCCESS_MESSAGE };
	}

	async function signIn(input: SignInEmailInput): Promise<AuthActionResult> {
		const result = await store.signIn(input);
		if (!result) return { success: false, message: store.error };
		await router.push(resolveRedirect(route.query.redirect));
		return { success: true, message: null };
	}

	async function signInWithGoogle(): Promise<AuthActionResult> {
		const redirect = resolveRedirect(route.query.redirect);
		const result = await store.signInGoogle(appUrl(redirect), appUrl("/login?error=oauth"));
		if (!result?.url) return { success: false, message: store.error };
		// disableRedirect: a API devolve a URL do Google e a navegação é nossa.
		window.location.href = result.url;
		return { success: true, message: null };
	}

	async function resendVerification(email: string): Promise<AuthActionResult> {
		await store.resendVerification(email, appUrl("/"));
		if (store.error) return { success: false, message: store.error };
		return { success: true, message: VERIFICATION_RESENT_MESSAGE };
	}

	function resetDomainStores() {
		useAppointmentStore().$reset();
		useAppointmentTemplateStore().$reset();
		useCustomerStore().$reset();
		useQuestionOptionStore().$reset();
		useSchedulingConfigStore().$reset();
		useTemplateQuestionStore().$reset();
		useUserStore().$reset();
		useWhatsappStore().$reset();
	}

	async function logout(): Promise<AuthActionResult> {
		const result = await store.signOut();
		if (!result) return { success: false, message: store.error };
		resetDomainStores();
		await router.push("/login");
		return { success: true, message: null };
	}

	async function requestPasswordReset(email: string): Promise<AuthActionResult> {
		await store.forgotPassword(email, appUrl("/redefinir-senha"));
		if (store.error) return { success: false, message: store.error };
		return { success: true, message: REQUEST_RESET_SUCCESS_MESSAGE };
	}

	// O link do e-mail passa pelo better-auth e volta pra /redefinir-senha com ?token=… ou
	// ?error=INVALID_TOKEN quando o token é inválido/expirado.
	const resetToken = computed(() =>
		typeof route.query.token === "string" && !route.query.error ? route.query.token : null,
	);
	const resetTokenError = computed(() => (resetToken.value ? null : INVALID_RESET_TOKEN_MESSAGE));

	async function resetPassword(newPassword: string): Promise<AuthActionResult> {
		if (!resetToken.value) return { success: false, message: INVALID_RESET_TOKEN_MESSAGE };
		const result = await store.resetPassword(newPassword, resetToken.value);
		if (!result) return { success: false, message: store.error };
		await router.push("/login");
		return { success: true, message: "Senha redefinida. Entre com a nova senha." };
	}

	return {
		currentUser,
		isLoading: computed(() => store.isLoading),
		resetTokenError,
		signUp,
		signIn,
		signInWithGoogle,
		resendVerification,
		logout,
		requestPasswordReset,
		resetPassword,
	};
}
