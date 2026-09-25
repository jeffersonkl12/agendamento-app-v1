import { formatCurrency, formatPhone, formatTime, parseLocalDate } from "@libs/format";
import type { Appointment, AppointmentStatus } from "@services/appointment";
import { useCustomerStore } from "@stores/customer";
import { useServiceTemplateStore } from "@stores/service-template";

export type AppointmentStatusVariant = "success" | "warning" | "error";

/** Agendamento pronto pra exibição: cliente e modelo já resolvidos, valores e datas formatados. */
export interface AppointmentSummary {
	id: string;
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
	AWAITING: { label: "Aguardando cliente", variant: "warning" },
	CONFIRMED: { label: "Confirmado", variant: "success" },
	CANCELED: { label: "Cancelado", variant: "error" },
};

function formatDayLabel(isoDate: string): string {
	const date = parseLocalDate(isoDate);
	return `${WEEKDAY_SHORT[date.getDay()]} ${String(date.getDate()).padStart(2, "0")}`;
}

/** Ordena por data + horário — a API não garante ordem (§10.2). */
export function compareAppointmentsBySchedule(a: Appointment, b: Appointment): number {
	return a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date);
}

/**
 * Monta o resumo de um agendamento cruzando `customerId` com os clientes e `templateId` com os
 * modelos (§10.2: a lista não traz cliente). Sem nome, o cliente é exibido pelo telefone (§9).
 */
export function useAppointmentSummary() {
	const customerStore = useCustomerStore();
	const templateStore = useServiceTemplateStore();

	function resolveClientName(customerId: string): string {
		const customer = customerStore.customerById.get(customerId);
		if (!customer) return "Cliente";
		return customer.name?.trim() || formatPhone(customer.phoneNumber);
	}

	function toSummary(appointment: Appointment): AppointmentSummary {
		const status = STATUS_DISPLAY[appointment.status];
		return {
			id: appointment.id,
			date: appointment.date,
			dayLabel: formatDayLabel(appointment.date),
			time: formatTime(appointment.startTime),
			clientName: resolveClientName(appointment.customerId),
			templateName: templateStore.templateById.get(appointment.templateId)?.name ?? "Atendimento",
			status: appointment.status,
			statusLabel: status.label,
			statusVariant: status.variant,
			totalValueLabel: formatCurrency(appointment.totalValue),
		};
	}

	return { toSummary };
}
