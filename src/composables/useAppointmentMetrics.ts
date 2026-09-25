import type { Appointment } from "@services/appointment";
import { computed, type Ref } from "vue";

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

/**
 * Métricas do Início (dashboard-api-routes.md §11): a API não expõe indicadores prontos,
 * o painel calcula em cima de GET /appointments. "Este mês" usa o fuso do prestador, não o do navegador.
 */
export function useAppointmentMetrics(appointments: Ref<Appointment[]>, timezone: Ref<string>) {
	const confirmed = computed(() => appointments.value.filter((a) => a.status === "CONFIRMED"));

	const currentYearMonth = computed(() => getProviderYearMonth(timezone.value, new Date()));

	const confirmedThisMonth = computed(() =>
		confirmed.value.filter((a) => a.date.startsWith(currentYearMonth.value)),
	);

	const revenueThisMonth = computed(() =>
		confirmedThisMonth.value.reduce((total, a) => total + a.totalValue, 0),
	);

	const appointmentsThisMonth = computed(() => confirmedThisMonth.value.length);

	const averageTicketThisMonth = computed(() =>
		appointmentsThisMonth.value > 0 ? revenueThisMonth.value / appointmentsThisMonth.value : 0,
	);

	const totalAppointments = computed(() => appointments.value.length);

	const upcomingAppointments = computed(() => {
		const now = Date.now();
		return appointments.value
			.filter((a) => a.status !== "CANCELED")
			.map((a) => ({ appointment: a, at: zonedTimeToUtc(a.date, a.startTime, timezone.value) }))
			.filter(({ at }) => at.getTime() >= now)
			.sort((a, b) => a.at.getTime() - b.at.getTime())
			.slice(0, 3)
			.map(({ appointment }) => appointment);
	});

	return {
		revenueThisMonth,
		appointmentsThisMonth,
		averageTicketThisMonth,
		totalAppointments,
		upcomingAppointments,
	};
}
