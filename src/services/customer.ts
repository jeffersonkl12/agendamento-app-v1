import { http } from "@services/http";

export interface Customer {
	id: string;
	businessOwnerId: string;
	phoneNumber: string;
	name: string | null;
	createdAt: string;
	updatedAt: string;
}

export async function listCustomers() {
	const { data } = await http.get<Customer[]>("/customers");
	return data;
}

export async function updateCustomer(id: string, name: string) {
	const { data } = await http.patch<Customer>(`/customers/${id}`, { name });
	return data;
}
