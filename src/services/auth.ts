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

export async function signInWithGoogle() {
	return authClient.signIn.social({ provider: "google" });
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
