import { useAppointmentSummary } from "@composables/useAppointmentSummary";
import { formatCurrency } from "@libs/format";
import type { AppointmentAnswer } from "@services/appointment-answer";
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

const CANCEL_CONFLICT_MESSAGE = "Este agendamento já tinha sido cancelado ou concluído.";

/** O `value` da resposta tem o formato do `questionType` (back-api.md §5.5). */
function formatAnswerValue(answer: AppointmentAnswer): string {
	const { value } = answer;
	if (typeof value === "boolean") return value ? "Sim" : "Não";
	if (Array.isArray(value)) return value.join(", ");
	return String(value);
}

/**
 * Detalhe de um agendamento (back-api.md §5.7/§5.8): carrega as respostas só ao abrir, exibe o
 * snapshot (RN-S01) — não as perguntas atuais do serviço — e trata o cancelamento (RN-A01).
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

	const storedAnswers = computed(() =>
		selectedId.value ? (appointmentStore.answersByAppointmentId[selectedId.value] ?? []) : [],
	);

	const answers = computed<AppointmentAnswerItem[]>(() =>
		storedAnswers.value.map((answer) => ({
			id: answer.id,
			title: answer.questionLabel,
			answer: formatAnswerValue(answer),
			priceLabel: answer.priceInCents ? formatCurrency(answer.priceInCents) : null,
		})),
	);

	// RN-S03: o "serviço" é a resposta da primeira pergunta de escolha única do snapshot.
	const serviceLabel = computed(() => {
		const singleChoice = storedAnswers.value.find(
			(answer) => answer.questionType === "single_choice",
		);
		return singleChoice ? formatAnswerValue(singleChoice) : (summary.value?.templateName ?? "");
	});

	// O agendamento guarda o preço base congelado; `null` quando o serviço não tinha preço base.
	const baseValueLabel = computed(() => {
		const basePrice = selectedAppointment.value?.basePriceInCents;
		return basePrice == null ? null : formatCurrency(basePrice);
	});

	// O cliente só altera/cancela enquanto `pending`/`scheduled` (back-api.md §5.7).
	const canCancel = computed(
		() => summary.value?.status === "pending" || summary.value?.status === "scheduled",
	);

	async function open(id: string) {
		selectedId.value = id;
		isOpen.value = true;
		isDetailLoading.value = true;
		await appointmentStore.fetchAnswers(id);
		isDetailLoading.value = false;
	}

	async function cancel(): Promise<AppointmentActionResult> {
		if (!selectedId.value) return { success: false, message: CANCEL_CONFLICT_MESSAGE };

		isCancelling.value = true;
		const result = await appointmentStore.setStatus(selectedId.value, "canceled");
		isCancelling.value = false;

		if (result) {
			isOpen.value = false;
			return { success: true, message: "Agendamento cancelado. O horário foi liberado." };
		}
		// 404/422: o agendamento mudou por fora (ex.: o cliente cancelou pelo WhatsApp); recarrega a lista.
		if (appointmentStore.errorStatus === 404 || appointmentStore.errorStatus === 422) {
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
