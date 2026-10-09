import {
	compareAppointmentsBySchedule,
	useAppointmentSummary,
} from "@composables/useAppointmentSummary";
import { useProviderTimezone } from "@composables/useProviderTimezone";
import { formatCurrency, isoDateInTimezone } from "@libs/format";
import type { Appointment } from "@services/appointment";
import { useAppointmentStore } from "@stores/appointment";
import { computed } from "vue";

export type MetricsPeriod = "month" | "total";

export interface PeriodMetrics {
	revenueLabel: string;
	appointmentsCount: number;
	averageTicketLabel: string;
}

const UPCOMING_LIMIT = 3;

/** "Ano-mês" (YYYY-MM) de um instante no fuso informado. */
function getYearMonth(timeZone: string, instant: Date): string {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
	}).formatToParts(instant);
	const year = parts.find((part) => part.type === "year")?.value ?? "";
	const month = parts.find((part) => part.type === "month")?.value ?? "";
	return `${year}-${month}`;
}

// Faturamento só conta atendimento confirmado ou já realizado.
const REVENUE_STATUSES: readonly Appointment["status"][] = ["scheduled", "completed"];
// "Próximos" são os que ainda vão acontecer.
const UPCOMING_STATUSES: readonly Appointment["status"][] = ["pending", "scheduled"];

/** Faturamento, quantidade e ticket médio sobre agendamentos confirmados/concluídos (RN-I01…I03). */
function computePeriodMetrics(confirmed: Appointment[]): PeriodMetrics {
	const revenue = confirmed.reduce(
		(total, appointment) => total + appointment.totalPriceInCents,
		0,
	);
	const count = confirmed.length;
	return {
		revenueLabel: formatCurrency(revenue, 0),
		appointmentsCount: count,
		averageTicketLabel: formatCurrency(count > 0 ? Math.round(revenue / count) : 0),
	};
}

/**
 * Métricas do Início: a API não expõe indicadores prontos, o painel calcula em cima de
 * GET /appointments (back-api.md §5.7). "Este mês" usa o fuso do profissional, não o do navegador.
 * Só `scheduled` e `completed` contam no faturamento e na quantidade — em ambos os períodos.
 */
export function useAppointmentMetrics() {
	const appointmentStore = useAppointmentStore();
	const { timezone, timezoneOf } = useProviderTimezone();
	const { toSummary } = useAppointmentSummary();

	const confirmed = computed(() =>
		appointmentStore.appointments.filter((appointment) =>
			REVENUE_STATUSES.includes(appointment.status),
		),
	);

	const metricsByPeriod = computed<Record<MetricsPeriod, PeriodMetrics>>(() => {
		const currentYearMonth = getYearMonth(timezone.value, new Date());
		const confirmedThisMonth = confirmed.value.filter(
			(appointment) =>
				isoDateInTimezone(appointment.startsAt, timezoneOf(appointment.templateId)).slice(0, 7) ===
				currentYearMonth,
		);
		return {
			month: computePeriodMetrics(confirmedThisMonth),
			total: computePeriodMetrics(confirmed.value),
		};
	});

	const upcomingAppointments = computed(() => {
		const now = Date.now();
		return appointmentStore.appointments
			.filter((appointment) => UPCOMING_STATUSES.includes(appointment.status))
			.filter((appointment) => Date.parse(appointment.startsAt) >= now)
			.sort(compareAppointmentsBySchedule)
			.slice(0, UPCOMING_LIMIT)
			.map(toSummary);
	});

	return {
		metricsByPeriod,
		upcomingAppointments,
		isInitialLoading: computed(() => !appointmentStore.hasLoaded && appointmentStore.isLoading),
	};
}
