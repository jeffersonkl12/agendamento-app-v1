import { http } from "@services/http";

export interface ServiceTemplate {
	id: string;
	businessOwnerId: string;
	name: string;
	basePrice: number;
	version: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreateServiceTemplateInput {
	name: string;
	basePrice?: number;
}

export interface UpdateServiceTemplateInput {
	name?: string;
	basePrice?: number;
}

export async function listServiceTemplates() {
	const { data } = await http.get<ServiceTemplate[]>("/service-templates");
	return data;
}

export async function getServiceTemplate(id: string) {
	const { data } = await http.get<ServiceTemplate>(`/service-templates/${id}`);
	return data;
}

export async function createServiceTemplate(input: CreateServiceTemplateInput) {
	const { data } = await http.post<ServiceTemplate>("/service-templates", input);
	return data;
}

export async function updateServiceTemplate(id: string, input: UpdateServiceTemplateInput) {
	const { data } = await http.patch<ServiceTemplate>(`/service-templates/${id}`, input);
	return data;
}

export async function deleteServiceTemplate(id: string) {
	await http.delete(`/service-templates/${id}`);
}
