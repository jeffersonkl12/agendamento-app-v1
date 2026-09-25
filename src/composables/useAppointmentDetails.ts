import { useAppointmentSummary } from "@composables/useAppointmentSummary";
import { formatCurrency } from "@libs/format";
import { useAppointmentStore } from "@stores/appointment";
import { computed, ref } from "vue";

export interface AppointmentAnswerItem {
	id: string;
	title: string;
	answer: string;
	/** `null` quando a resposta não somou valor. */
	priceLabel: string | null;
}

export interface AppointmentActionResult {
	success: boolean;
	message: string;
}

const CANCEL_CONFLICT_MESSAGE = "Este agendamento já tinha sido cancelado ou expirou.";

/**
 * Detalhe de um agendamento (dashboard-api-routes.md §10.3): carrega as respostas só ao abrir,
 * exibe o snapshot (RN-S01) — não as perguntas atuais do modelo — e trata o cancelamento (RN-A01).
 */
export function useAppointmentDetails() {
	const appointmentStore = useAppointmentStore();
	const { toSummary } = useAppointmentSummary();

	const selectedId = ref<string | null>(null);
	const isOpen = ref(false);
	const isDetailLoading = ref(false);
	const isCancelling = ref(false);

	const selectedAppointment = computed(() =>
		appointmentStore.appointments.find((appointment) => appointment.id === selectedId.value),
	);

	const summary = computed(() =>
		selectedAppointment.value ? toSummary(selectedAppointment.value) : null,
	);

	const detail = computed(() =>
		selectedId.value ? appointmentStore.detailsById[selectedId.value] : undefined,
	);

	const sortedAnswers = computed(() =>
		[...(detail.value?.answers ?? [])].sort((a, b) => a.order - b.order),
	);

	const answers = computed<AppointmentAnswerItem[]>(() =>
		sortedAnswers.value.map((answer) => ({
			id: answer.id,
			title: answer.questionTitle,
			answer: answer.answer,
			priceLabel: answer.appliedPrice ? formatCurrency(answer.appliedPrice) : null,
		})),
	);

	// RN-S03: o "serviço" é a resposta da primeira pergunta SINGLE do snapshot.
	const serviceLabel = computed(
		() =>
			sortedAnswers.value.find((answer) => answer.questionType === "SINGLE")?.answer ??
			summary.value?.templateName ??
			"",
	);

	// §10.3: totalValue − Σ appliedPrice = valor base do modelo naquela versão.
	const baseValueLabel = computed(() => {
		if (!detail.value) return null;
		const answersTotal = detail.value.answers.reduce(
			(total, answer) => total + (answer.appliedPrice ?? 0),
			0,
		);
		return formatCurrency(detail.value.totalValue - answersTotal);
	});

	const canCancel = computed(() => summary.value !== null && summary.value.status !== "CANCELED");

	async function open(id: string) {
		selectedId.value = id;
		isOpen.value = true;
		isDetailLoading.value = true;
		await appointmentStore.fetchAppointmentDetail(id);
		isDetailLoading.value = false;
	}

	async function cancel(): Promise<AppointmentActionResult> {
		if (!selectedId.value) return { success: false, message: CANCEL_CONFLICT_MESSAGE };

		isCancelling.value = true;
		const result = await appointmentStore.cancel(selectedId.value);
		isCancelling.value = false;

		if (result) {
			isOpen.value = false;
			return { success: true, message: "Agendamento cancelado. O horário foi liberado." };
		}
		// 409: o status mudou por fora (expiração automática do AWAITING — §10.1); a lista é recarregada.
		if (appointmentStore.errorStatus === 409) {
			await appointmentStore.fetchAppointments();
			return { success: false, message: CANCEL_CONFLICT_MESSAGE };
		}
		return { success: false, message: appointmentStore.error ?? CANCEL_CONFLICT_MESSAGE };
	}

	return {
		isOpen,
		summary,
		answers,
		serviceLabel,
		baseValueLabel,
		canCancel,
		isDetailLoading,
		isCancelling,
		open,
		cancel,
	};
}
