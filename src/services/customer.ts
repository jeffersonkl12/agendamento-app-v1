import { http } from "@services/http";

export interface Customer {
	id: string;
	userId: string;
	phone: string;
	name: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateCustomerInput {
	phone: string;
	name?: string | null;
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export async function listCustomers() {
	const { data } = await http.get<Customer[]>("/customers");
	return data;
}

export async function createCustomer(input: CreateCustomerInput) {
	const { data } = await http.post<Customer>("/customers", input);
	return data;
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
	const { data } = await http.patch<Customer>(`/customers/${id}`, input);
	return data;
}

export async function deleteCustomer(id: string) {
	await http.delete(`/customers/${id}`);
}
