import { http } from "@services/http";

/** Um "serviço" que o cliente pode agendar (back-api.md §5.3). */
export interface AppointmentTemplate {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	/** `null` = sem preço base. */
	basePriceInCents: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateAppointmentTemplateInput {
	name: string;
	description?: string | null;
	basePriceInCents?: number | null;
}

export type UpdateAppointmentTemplateInput = Partial<CreateAppointmentTemplateInput>;

export async function listAppointmentTemplates() {
	const { data } = await http.get<AppointmentTemplate[]>("/appointment-templates");
	return data;
}

export async function createAppointmentTemplate(input: CreateAppointmentTemplateInput) {
	const { data } = await http.post<AppointmentTemplate>("/appointment-templates", input);
	return data;
}

export async function updateAppointmentTemplate(id: string, input: UpdateAppointmentTemplateInput) {
	const { data } = await http.patch<AppointmentTemplate>(`/appointment-templates/${id}`, input);
	return data;
}

// Remove em cascata a configuração de agenda, perguntas e opções; agendamentos ficam com templateId nulo.
export async function deleteAppointmentTemplate(id: string) {
	await http.delete(`/appointment-templates/${id}`);
}
