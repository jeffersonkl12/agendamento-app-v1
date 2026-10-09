import { resolveApiBaseUrl } from "@libs/api-base-url";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/vue";

// `phone` e `tradeName` são additionalFields do usuário no back (back-api.md §2).
export const authClient = createAuthClient({
	baseURL: resolveApiBaseUrl(import.meta.env.VITE_API_URL),
	fetchOptions: { credentials: "include" },
	plugins: [
		inferAdditionalFields({
			user: {
				phone: { type: "string", required: false },
				tradeName: { type: "string", required: false },
			},
		}),
	],
});

export const useSession = authClient.useSession;

export interface SignUpEmailInput {
	name: string;
	email: string;
	password: string;
	/** Só dígitos com DDI, sem "+" (`^[1-9]\d{9,14}$`) — esta rota do Better Auth não valida. */
	phone?: string;
	tradeName?: string;
	/** URL absoluta do painel pra onde o link de verificação de e-mail redireciona. */
	callbackURL?: string;
}

export interface SignInEmailInput {
	email: string;
	password: string;
}

export async function signUpWithEmail(input: SignUpEmailInput) {
	return authClient.signUp.email(input);
}

export async function signInWithEmail(input: SignInEmailInput) {
	return authClient.signIn.email(input);
}

// `disableRedirect` devolve a URL do Google em vez de redirecionar (XHR não segue redirect
// cross-origin); quem chama navega com `window.location.href`. Os callbacks precisam ser absolutos
// e estar em TRUSTED_ORIGINS no back.
export async function signInWithGoogle(callbackURL: string, errorCallbackURL: string) {
	return authClient.signIn.social({
		provider: "google",
		callbackURL,
		errorCallbackURL,
		disableRedirect: true,
	});
}

export async function sendVerificationEmail(email: string, callbackURL: string) {
	return authClient.sendVerificationEmail({ email, callbackURL });
}

export async function signOut() {
	return authClient.signOut();
}

export async function getSession() {
	return authClient.getSession();
}

export async function requestPasswordReset(email: string, redirectTo?: string) {
	return authClient.requestPasswordReset({ email, redirectTo });
}

export async function resetPassword(newPassword: string, token: string) {
	return authClient.resetPassword({ newPassword, token });
}
