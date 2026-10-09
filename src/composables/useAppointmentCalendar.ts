import { useProviderTimezone } from "@composables/useProviderTimezone";
import {
	formatLongDate,
	formatMonthYear,
	isoDateInTimezone,
	todayInTimezone,
	toIsoDate,
} from "@libs/format";
import type { Weekday } from "@services/scheduling-config";
import { useAppointmentStore } from "@stores/appointment";
import { useSchedulingConfigStore } from "@stores/scheduling-config";
import { computed } from "vue";

export type CalendarDayState = "has-appointments" | "available" | "unavailable";

export interface CalendarDay {
	date: string;
	day: number;
	state: CalendarDayState;
	isToday: boolean;
	ariaLabel: string;
}

/** Célula vazia completa a última semana — o design nunca mostra dias do mês seguinte. */
export type CalendarCell = CalendarDay | null;

const WEEKDAYS_MONDAY_FIRST: readonly Weekday[] = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
];

const STATE_ARIA_SUFFIX: Record<CalendarDayState, string> = {
	"has-appointments": ", com agendamentos",
	available: "",
	unavailable: ", sem atendimento",
};

/**
 * Calendário da agenda (RN-G01…G07): semana começa na segunda; "tem agendamentos" vence mesmo em
 * dia desabilitado (agendamentos antigos continuam visíveis — RN-C04), senão o dia está disponível
 * se algum serviço atende nele (`openDays` das configurações — back-api.md §5.4).
 */
export function useAppointmentCalendar() {
	const appointmentStore = useAppointmentStore();
	const configStore = useSchedulingConfigStore();
	const { timezone, timezoneOf } = useProviderTimezone();

	const today = computed(() => todayInTimezone(timezone.value));

	const datesWithAppointments = computed(
		() =>
			new Set(
				appointmentStore.appointments
					.filter((appointment) => appointment.status !== "canceled")
					.map((appointment) =>
						isoDateInTimezone(appointment.startsAt, timezoneOf(appointment.templateId)),
					),
			),
	);

	const openWeekdays = computed(
		() => new Set(configStore.configs.flatMap((config) => config.openDays)),
	);

	function getDayState(date: Date): CalendarDayState {
		if (datesWithAppointments.value.has(toIsoDate(date))) return "has-appointments";
		const mondayFirstIndex = (date.getDay() + 6) % 7;
		if (openWeekdays.value.has(WEEKDAYS_MONDAY_FIRST[mondayFirstIndex])) return "available";
		return "unavailable";
	}

	// new Date normaliza dia <= 0 para o mês anterior (ex.: 2026-09-00 → 31 de agosto).
	function createDay(year: number, monthIndex: number, day: number): CalendarDay {
		const date = new Date(year, monthIndex, day);
		const iso = toIsoDate(date);
		const state = getDayState(date);
		return {
			date: iso,
			day: date.getDate(),
			state,
			isToday: iso === today.value,
			// O dot é aria-hidden; o estado do dia chega ao leitor de tela por aqui.
			ariaLabel: `${formatLongDate(iso)}${STATE_ARIA_SUFFIX[state]}`,
		};
	}

	function buildMonthWeeks(year: number, monthIndex: number): CalendarCell[][] {
		const leadingDays = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
		const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

		const cells: CalendarCell[] = [];
		for (let offset = leadingDays; offset > 0; offset--) {
			cells.push(createDay(year, monthIndex, 1 - offset));
		}
		for (let day = 1; day <= daysInMonth; day++) {
			cells.push(createDay(year, monthIndex, day));
		}
		while (cells.length % 7 !== 0) {
			cells.push(null);
		}

		const rows: CalendarCell[][] = [];
		for (let index = 0; index < cells.length; index += 7) {
			rows.push(cells.slice(index, index + 7));
		}
		return rows;
	}

	return { today, buildMonthWeeks, formatMonthLabel: formatMonthYear };
}
