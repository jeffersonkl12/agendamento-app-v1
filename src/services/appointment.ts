import { http } from "@services/http";
import type { QuestionType } from "@services/service-template-question";

export type AppointmentStatus = "AWAITING" | "CONFIRMED" | "CANCELED";
export type AppointmentOrigin = "WHATSAPP";

export interface Appointment {
	id: string;
	businessOwnerId: string;
	customerId: string;
	templateId: string;
	templateVersion: number;
	date: string;
	startTime: string;
	totalValue: number;
	status: AppointmentStatus;
	origin: AppointmentOrigin;
	idempotencyKey: string;
	createdAt: string;
	updatedAt: string;
}

export interface AppointmentAnswer {
	id: string;
	appointmentId: string;
	questionTitle: string;
	questionType: QuestionType;
	answer: string;
	appliedPrice: number | null;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface AppointmentDetail extends Appointment {
	answers: AppointmentAnswer[];
}

// Criação (POST /appointments) é uso exclusivo do bot — não expor no painel (dashboard-api-routes.md §10/§12).
export async function listAppointments() {
	const { data } = await http.get<Appointment[]>("/appointments");
	return data;
}

export async function getAppointment(id: string) {
	const { data } = await http.get<AppointmentDetail>(`/appointments/${id}`);
	return data;
}

export async function cancelAppointment(id: string) {
	const { data } = await http.post<Appointment>(`/appointments/${id}/cancel`);
	return data;
}

export async function confirmAppointment(id: string) {
	const { data } = await http.post<Appointment>(`/appointments/${id}/confirm`);
	return data;
}
