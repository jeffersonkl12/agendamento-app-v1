import type { SignInEmailInput, SignUpEmailInput } from "@services/auth";
import { useAppointmentStore } from "@stores/appointment";
import { useAuthStore } from "@stores/auth";
import { useBusinessProfileStore } from "@stores/business-profile";
import { useCustomerStore } from "@stores/customer";
import { useSchedulingConfigStore } from "@stores/scheduling-config";
import { useServiceTemplateStore } from "@stores/service-template";
import { useServiceTemplateQuestionStore } from "@stores/service-template-question";
import { useSubscriptionStore } from "@stores/subscription";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

// RN-AU04: recuperação de senha sempre devolve a mesma mensagem de sucesso, exista ou não o e-mail —
// o composable não revela se o cadastro existe, mesmo a API já garantindo isso no back.
const REQUEST_RESET_SUCCESS_MESSAGE =
	"Se este e-mail estiver cadastrado, você vai receber um link de redefinição de senha.";

const SIGN_UP_SUCCESS_MESSAGE =
	"Conta criada! Enviamos um link de verificação para o seu e-mail — confirme antes de entrar.";

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
 * Regra de negócio de autenticação (dashboard-api-routes.md §2) por cima da store de sessão:
 * estado derivado, navegação pós-login/logout, mensagens únicas e limpeza das stores no logout.
 */
export function useAuth() {
	const store = useAuthStore();
	const router = useRouter();
	const route = useRoute();

	const currentUser = computed(() => store.session.data?.user ?? null);

	async function signUp(input: Omit<SignUpEmailInput, "callbackURL">): Promise<AuthActionResult> {
		const user = await store.signUp({ ...input, callbackURL: appUrl("/login") });
		if (!user) return { success: false, message: store.error };
		// Cadastro não loga automaticamente (§2): o usuário precisa verificar o e-mail antes de entrar.
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
		const result = await store.signInGoogle(appUrl(redirect));
		// Em sucesso o better-auth redireciona o navegador pro Google; só volta aqui em erro.
		return result ? { success: true, message: null } : { success: false, message: store.error };
	}

	function resetDomainStores() {
		useAppointmentStore().$reset();
		useBusinessProfileStore().$reset();
		useCustomerStore().$reset();
		useSchedulingConfigStore().$reset();
		useServiceTemplateStore().$reset();
		useServiceTemplateQuestionStore().$reset();
		useSubscriptionStore().$reset();
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
		logout,
		requestPasswordReset,
		resetPassword,
	};
}
