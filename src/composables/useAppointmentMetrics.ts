import {
	compareAppointmentsBySchedule,
	useAppointmentSummary,
} from "@composables/useAppointmentSummary";
import { useProviderTimezone } from "@composables/useProviderTimezone";
import { formatCurrency } from "@libs/format";
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

/** Converte a hora "de parede" (data + hora no fuso do prestador) pra um instante real, sem libs de data. */
function zonedTimeToUtc(date: string, time: string, timeZone: string): Date {
	const naiveDate = new Date(`${date}T${time}`);
	const tzDate = new Date(naiveDate.toLocaleString("en-US", { timeZone }));
	const offset = naiveDate.getTime() - tzDate.getTime();
	return new Date(naiveDate.getTime() + offset);
}

function getProviderYearMonth(timeZone: string, now: Date): string {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
	}).formatToParts(now);
	const year = parts.find((part) => part.type === "year")?.value ?? "";
	const month = parts.find((part) => part.type === "month")?.value ?? "";
	return `${year}-${month}`;
}

/** Faturamento, quantidade e ticket médio sobre agendamentos CONFIRMED (RN-I01…I03). */
function computePeriodMetrics(confirmed: Appointment[]): PeriodMetrics {
	const revenue = confirmed.reduce((total, appointment) => total + appointment.totalValue, 0);
	const count = confirmed.length;
	return {
		revenueLabel: formatCurrency(revenue, 0),
		appointmentsCount: count,
		averageTicketLabel: formatCurrency(count > 0 ? Math.round(revenue / count) : 0),
	};
}

/**
 * Métricas do Início (dashboard-api-routes.md §11): a API não expõe indicadores prontos,
 * o painel calcula em cima de GET /appointments. "Este mês" usa o fuso do prestador, não o do navegador.
 * Só CONFIRMED conta no faturamento e na quantidade (§10.1) — em ambos os períodos.
 */
export function useAppointmentMetrics() {
	const appointmentStore = useAppointmentStore();
	const timezone = useProviderTimezone();
	const { toSummary } = useAppointmentSummary();

	const confirmed = computed(() =>
		appointmentStore.appointments.filter((appointment) => appointment.status === "CONFIRMED"),
	);

	const metricsByPeriod = computed<Record<MetricsPeriod, PeriodMetrics>>(() => {
		const currentYearMonth = getProviderYearMonth(timezone.value, new Date());
		const confirmedThisMonth = confirmed.value.filter((appointment) =>
			appointment.date.startsWith(currentYearMonth),
		);
		return {
			month: computePeriodMetrics(confirmedThisMonth),
			total: computePeriodMetrics(confirmed.value),
		};
	});

	const upcomingAppointments = computed(() => {
		const now = Date.now();
		return appointmentStore.appointments
			.filter((appointment) => appointment.status !== "CANCELED")
			.filter(
				(appointment) =>
					zonedTimeToUtc(appointment.date, appointment.startTime, timezone.value).getTime() >= now,
			)
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
