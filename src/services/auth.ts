import { createAuthClient } from "better-auth/vue";

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_API_URL,
});

export const useSession = authClient.useSession;

export interface SignUpEmailInput {
	name: string;
	email: string;
	password: string;
	phoneNumber?: string;
	/** Para onde o link de verificação de e-mail redireciona depois de confirmar. */
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

// Sem callbackURL absoluto o better-auth volta pra URL da API, não pro painel.
export async function signInWithGoogle(callbackURL: string) {
	return authClient.signIn.social({ provider: "google", callbackURL });
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
