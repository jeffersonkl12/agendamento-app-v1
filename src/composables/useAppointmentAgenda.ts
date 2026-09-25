import {
	type AppointmentSummary,
	compareAppointmentsBySchedule,
	useAppointmentSummary,
} from "@composables/useAppointmentSummary";
import { formatWeekdayDayMonth } from "@libs/format";
import { useAppointmentStore } from "@stores/appointment";
import { useCustomerStore } from "@stores/customer";
import { useSchedulingConfigStore } from "@stores/scheduling-config";
import { useServiceTemplateStore } from "@stores/service-template";
import { useEventListener, useIntervalFn } from "@vueuse/core";
import { computed, onMounted } from "vue";

export interface AppointmentDateGroup {
	date: string;
	/** "Quarta-feira, 23 de setembro" */
	dateLabel: string;
	items: AppointmentSummary[];
}

// O servidor expira AWAITING a cada 5 min (§10.1) — recarregar no mesmo ritmo mantém a tela fiel.
const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Agenda do prestador (dashboard-api-routes.md §10.2/§11): junta agendamentos, clientes, modelos e
 * configuração; esconde CANCELED (RN-A03) e ordena por data/horário, já que a API não filtra nem ordena.
 */
export function useAppointmentAgenda() {
	const appointmentStore = useAppointmentStore();
	const customerStore = useCustomerStore();
	const templateStore = useServiceTemplateStore();
	const configStore = useSchedulingConfigStore();
	const { toSummary } = useAppointmentSummary();

	const isInitialLoading = computed(
		() => !appointmentStore.hasLoaded && appointmentStore.isLoading,
	);

	const visibleSummaries = computed(() =>
		appointmentStore.appointments
			.filter((appointment) => appointment.status !== "CANCELED")
			.sort(compareAppointmentsBySchedule)
			.map(toSummary),
	);

	const groupedByDate = computed<AppointmentDateGroup[]>(() => {
		const byDate = new Map<string, AppointmentSummary[]>();
		for (const summary of visibleSummaries.value) {
			const bucket = byDate.get(summary.date) ?? [];
			bucket.push(summary);
			byDate.set(summary.date, bucket);
		}
		return [...byDate.entries()].map(([date, items]) => ({
			date,
			dateLabel: formatWeekdayDayMonth(date),
			items,
		}));
	});

	function summariesOn(date: string): AppointmentSummary[] {
		return visibleSummaries.value.filter((summary) => summary.date === date);
	}

	// Clientes novos chegam pelo bot a qualquer momento, então sempre recarregam junto com a lista.
	async function refresh() {
		await Promise.all([appointmentStore.fetchAppointments(), customerStore.fetchCustomers()]);
	}

	async function load() {
		await Promise.all([refresh(), templateStore.ensureTemplates(), configStore.ensureMyConfig()]);
	}

	return {
		visibleSummaries,
		groupedByDate,
		isInitialLoading,
		error: computed(() => appointmentStore.error),
		summariesOn,
		load,
		refresh,
	};
}

/**
 * Carrega a agenda ao montar e recarrega ao focar a janela e a cada 5 min (§10.1: AWAITING pode virar
 * CANCELED sem ação do prestador). Deve ser chamado uma vez, pela página.
 */
export function useAppointmentAgendaSync() {
	const { load, refresh } = useAppointmentAgenda();

	onMounted(load);
	useEventListener(window, "focus", refresh);
	useIntervalFn(refresh, AUTO_REFRESH_INTERVAL_MS);
}
