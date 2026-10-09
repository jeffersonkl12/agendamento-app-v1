import { http } from "@services/http";
import type { QuestionType } from "@services/template-question";

/** Formato casa com `questionType` (back-api.md §5.5): string, number, boolean ou string[]. */
export type AppointmentAnswerValue = string | number | boolean | string[];

/** Resposta do cliente com a pergunta "congelada" no momento da reserva. */
export interface AppointmentAnswer {
	id: string;
	appointmentId: string;
	questionId: string | null;
	questionLabel: string;
	questionType: QuestionType;
	value: AppointmentAnswerValue;
	priceInCents: number;
}

export interface UpdateAppointmentAnswerInput {
	questionLabel?: string;
	value?: AppointmentAnswerValue;
	priceInCents?: number;
}

export async function listAppointmentAnswers(appointmentId: string) {
	const { data } = await http.get<AppointmentAnswer[]>("/appointment-answers", {
		params: { appointmentId },
	});
	return data;
}

// Editar respostas NÃO recalcula `totalPriceInCents` do agendamento.
export async function updateAppointmentAnswer(id: string, input: UpdateAppointmentAnswerInput) {
	const { data } = await http.patch<AppointmentAnswer>(`/appointment-answers/${id}`, input);
	return data;
}
