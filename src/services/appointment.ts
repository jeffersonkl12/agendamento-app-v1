import { http } from "@services/http";

export type AppointmentStatus = "pending" | "scheduled" | "completed" | "canceled" | "no_show";

export interface Appointment {
	id: string;
	userId: string;
	customerId: string;
	/** `null` quando o serviço foi excluído depois do agendamento. */
	templateId: string | null;
	status: AppointmentStatus;
	/** ISO 8601 em UTC. */
	startsAt: string;
	durationMinutes: number | null;
	basePriceInCents: number | null;
	totalPriceInCents: number;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ListAppointmentsParams {
	customerId?: string;
	status?: AppointmentStatus;
	/** Limite inferior inclusivo de `startsAt` (ISO). */
	from?: string;
	/** Limite superior inclusivo de `startsAt` (ISO). */
	to?: string;
}

export interface CreateAppointmentInput {
	customerId: string;
	startsAt: string;
	templateId?: string | null;
	status?: AppointmentStatus;
	durationMinutes?: number | null;
	basePriceInCents?: number | null;
	totalPriceInCents?: number;
	notes?: string | null;
}

// `customerId` e `templateId` são imutáveis.
export type UpdateAppointmentInput = Partial<
	Omit<CreateAppointmentInput, "customerId" | "templateId">
>;

// Ordem `startsAt` decrescente, sem paginação (back-api.md §5.7). O CRUD é "cru": não calcula
// preço nem valida disponibilidade.
export async function listAppointments(params?: ListAppointmentsParams) {
	const { data } = await http.get<Appointment[]>("/appointments", { params });
	return data;
}

export async function getAppointment(id: string) {
	const { data } = await http.get<Appointment>(`/appointments/${id}`);
	return data;
}

export async function createAppointment(input: CreateAppointmentInput) {
	const { data } = await http.post<Appointment>("/appointments", input);
	return data;
}

export async function updateAppointment(id: string, input: UpdateAppointmentInput) {
	const { data } = await http.patch<Appointment>(`/appointments/${id}`, input);
	return data;
}

export async function deleteAppointment(id: string) {
	await http.delete(`/appointments/${id}`);
}
