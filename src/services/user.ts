import { http } from "@services/http";

export interface PublicUser {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	phone: string | null;
	tradeName: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface UpdateUserInput {
	name?: string;
	phone?: string;
	tradeName?: string;
}

export async function getMe() {
	const { data } = await http.get<PublicUser>("/users/me");
	return data;
}

export async function updateMe(input: UpdateUserInput) {
	const { data } = await http.patch<PublicUser>("/users/me", input);
	return data;
}

// Exclui a conta e, em cascata, TODOS os dados do profissional (back-api.md §5.1).
export async function deleteMe() {
	await http.delete("/users/me");
}
