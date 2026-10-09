import {
	type AppointmentSummary,
	compareAppointmentsBySchedule,
	useAppointmentSummary,
} from "@composables/useAppointmentSummary";
import { formatWeekdayDayMonth } from "@libs/format";
import { useAppointmentStore } from "@stores/appointment";
import { useAppointmentTemplateStore } from "@stores/appointment-template";
import { useCustomerStore } from "@stores/customer";
import { useSchedulingConfigStore } from "@stores/scheduling-config";
import { useEventListener, useIntervalFn } from "@vueuse/core";
import { computed, onMounted } from "vue";

export interface AppointmentDateGroup {
	date: string;
	/** "Quarta-feira, 23 de setembro" */
	dateLabel: string;
	items: AppointmentSummary[];
}

// Não há push/WebSocket (back-api.md §7.4): agendamentos feitos pelo assistente aparecem por refetch.
const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Agenda do prestador (back-api.md §7.2): junta agendamentos, clientes, serviços e
 * configurações de agenda; esconde `canceled` (RN-A03) e ordena por início (a API devolve decrescente).
 */
export function useAppointmentAgenda() {
	const appointmentStore = useAppointmentStore();
	const customerStore = useCustomerStore();
	const templateStore = useAppointmentTemplateStore();
	const configStore = useSchedulingConfigStore();
	const { toSummary } = useAppointmentSummary();

	const isInitialLoading = computed(
		() => !appointmentStore.hasLoaded && appointmentStore.isLoading,
	);

	const visibleSummaries = computed(() =>
		appointmentStore.appointments
			.filter((appointment) => appointment.status !== "canceled")
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
		await Promise.all([refresh(), templateStore.ensureTemplates(), configStore.ensureConfigs()]);
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
 * Carrega a agenda ao montar e recarrega ao focar a janela e a cada 5 min (o assistente cria e cancela
 * agendamentos sem ação do profissional). Deve ser chamado uma vez, pela página.
 */
export function useAppointmentAgendaSync() {
	const { load, refresh } = useAppointmentAgenda();

	onMounted(load);
	useEventListener(window, "focus", refresh);
	useIntervalFn(refresh, AUTO_REFRESH_INTERVAL_MS);
}
