import { useProviderTimezone } from "@composables/useProviderTimezone";
import {
	formatCurrency,
	formatPhone,
	isoDateInTimezone,
	parseLocalDate,
	timeInTimezone,
} from "@libs/format";
import type { Appointment, AppointmentStatus } from "@services/appointment";
import { useAppointmentTemplateStore } from "@stores/appointment-template";
import { useCustomerStore } from "@stores/customer";

export type AppointmentStatusVariant = "success" | "warning" | "error";

/** Agendamento pronto pra exibição: cliente e serviço já resolvidos, valores e datas formatados. */
export interface AppointmentSummary {
	id: string;
	/** "YYYY-MM-DD" no fuso do serviço. */
	date: string;
	/** "QUA 23" */
	dayLabel: string;
	/** "14:30" */
	time: string;
	clientName: string;
	templateName: string;
	status: AppointmentStatus;
	statusLabel: string;
	statusVariant: AppointmentStatusVariant;
	totalValueLabel: string;
}

const WEEKDAY_SHORT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const STATUS_DISPLAY: Record<
	AppointmentStatus,
	{ label: string; variant: AppointmentStatusVariant }
> = {
	pending: { label: "Aguardando cliente", variant: "warning" },
	scheduled: { label: "Confirmado", variant: "success" },
	completed: { label: "Concluído", variant: "success" },
	canceled: { label: "Cancelado", variant: "error" },
	no_show: { label: "Não compareceu", variant: "error" },
};

function formatDayLabel(isoDate: string): string {
	const date = parseLocalDate(isoDate);
	return `${WEEKDAY_SHORT[date.getDay()]} ${String(date.getDate()).padStart(2, "0")}`;
}

/** Ordena pelo instante de início (crescente) — a API devolve `startsAt` decrescente (§5.7). */
export function compareAppointmentsBySchedule(a: Appointment, b: Appointment): number {
	return Date.parse(a.startsAt) - Date.parse(b.startsAt);
}

/**
 * Monta o resumo de um agendamento cruzando `customerId` com os clientes e `templateId` com os
 * serviços (a API não faz join — §7.2). Sem nome, o cliente é exibido pelo telefone.
 */
export function useAppointmentSummary() {
	const customerStore = useCustomerStore();
	const templateStore = useAppointmentTemplateStore();
	const { timezoneOf } = useProviderTimezone();

	function resolveClientName(customerId: string): string {
		const customer = customerStore.customerById.get(customerId);
		if (!customer) return "Cliente";
		return customer.name?.trim() || formatPhone(customer.phone);
	}

	function resolveTemplateName(templateId: string | null): string {
		return (templateId && templateStore.templateById.get(templateId)?.name) || "Atendimento";
	}

	function toSummary(appointment: Appointment): AppointmentSummary {
		const status = STATUS_DISPLAY[appointment.status];
		const timeZone = timezoneOf(appointment.templateId);
		const date = isoDateInTimezone(appointment.startsAt, timeZone);
		return {
			id: appointment.id,
			date,
			dayLabel: formatDayLabel(date),
			time: timeInTimezone(appointment.startsAt, timeZone),
			clientName: resolveClientName(appointment.customerId),
			templateName: resolveTemplateName(appointment.templateId),
			status: appointment.status,
			statusLabel: status.label,
			statusVariant: status.variant,
			totalValueLabel: formatCurrency(appointment.totalPriceInCents),
		};
	}

	return { toSummary };
}
