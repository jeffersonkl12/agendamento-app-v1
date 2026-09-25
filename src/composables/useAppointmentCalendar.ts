import type { Appointment } from "@services/appointment";
import type { SchedulingConfig } from "@services/scheduling-config";
import { computed, type Ref } from "vue";

export type CalendarDayState = "has-appointments" | "available" | "unavailable";

export interface CalendarDay {
	date: string;
	state: CalendarDayState;
	appointments: Appointment[];
}

const WEEKDAY_ENABLED_KEYS = [
	"mondayEnabled",
	"tuesdayEnabled",
	"wednesdayEnabled",
	"thursdayEnabled",
	"fridayEnabled",
	"saturdayEnabled",
	"sundayEnabled",
] as const satisfies readonly (keyof SchedulingConfig)[];

function toDateString(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function isDayEnabled(config: SchedulingConfig, date: string): boolean {
	const jsWeekday = new Date(`${date}T00:00:00`).getDay();
	const mondayFirstIndex = (jsWeekday + 6) % 7;
	return config[WEEKDAY_ENABLED_KEYS[mondayFirstIndex]];
}

/** As 7 datas (YYYY-MM-DD) da semana de `referenceDate`, começando na segunda-feira (RN-G01). */
export function getWeekDates(referenceDate: string): string[] {
	const reference = new Date(`${referenceDate}T00:00:00`);
	const mondayOffset = (reference.getDay() + 6) % 7;
	const monday = new Date(reference);
	monday.setDate(reference.getDate() - mondayOffset);

	return Array.from({ length: 7 }, (_, index) => {
		const day = new Date(monday);
		day.setDate(monday.getDate() + index);
		return toDateString(day);
	});
}

/**
 * Estado de cada dia do calendário (dashboard-api-routes.md, RN-G01…G07): "tem agendamentos" vence
 * mesmo em dia desabilitado (agendamentos antigos continuam visíveis — RN-C04), senão depende
 * de o dia estar habilitado na configuração.
 */
export function useAppointmentCalendar(
	appointments: Ref<Appointment[]>,
	config: Ref<SchedulingConfig | null>,
) {
	const appointmentsByDate = computed(() => {
		const map = new Map<string, Appointment[]>();
		for (const appointment of appointments.value) {
			if (appointment.status === "CANCELED") continue;
			const list = map.get(appointment.date) ?? [];
			list.push(appointment);
			map.set(appointment.date, list);
		}
		return map;
	});

	function getDayState(date: string): CalendarDay {
		const dayAppointments = appointmentsByDate.value.get(date) ?? [];
		if (dayAppointments.length > 0) {
			return { date, state: "has-appointments", appointments: dayAppointments };
		}
		if (config.value && isDayEnabled(config.value, date)) {
			return { date, state: "available", appointments: [] };
		}
		return { date, state: "unavailable", appointments: [] };
	}

	return { appointmentsByDate, getDayState };
}
