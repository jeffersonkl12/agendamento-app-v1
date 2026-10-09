import { useAppointmentTemplateStore } from "@stores/appointment-template";
import { useSchedulingConfigStore } from "@stores/scheduling-config";
import { useTemplateQuestionStore } from "@stores/template-question";
import { computed } from "vue";

export interface ServiceTemplateOption {
	id: string;
	name: string;
	/** `null` enquanto as perguntas do serviço não foram carregadas. */
	questionCount: number | null;
	/** Sem agenda configurada o assistente não tem horários pra oferecer (back-api.md §7.1). */
	hasSchedule: boolean;
}

export interface TemplateActionResult {
	success: boolean;
	message: string;
	templateId?: string;
}

const DEFAULT_TEMPLATE_NAME = "Novo modelo";

/**
 * Serviços do profissional (back-api.md §5.3): vários, cada um com a própria agenda e o próprio
 * questionário. Excluir remove em cascata agenda, perguntas e opções; agendamentos antigos ficam.
 */
export function useServiceTemplates() {
	const templateStore = useAppointmentTemplateStore();
	const questionStore = useTemplateQuestionStore();
	const configStore = useSchedulingConfigStore();

	function questionCountOf(templateId: string): number | null {
		return questionStore.questionsByTemplateId[templateId]?.length ?? null;
	}

	const options = computed<ServiceTemplateOption[]>(() =>
		templateStore.templates.map((template) => ({
			id: template.id,
			name: template.name,
			questionCount: questionCountOf(template.id),
			hasSchedule: configStore.configByTemplateId.has(template.id),
		})),
	);

	// GET /appointment-templates não traz perguntas; a contagem vem de uma chamada por serviço.
	// O volume de serviços por profissional é pequeno, então o custo é aceitável.
	async function load() {
		await Promise.all([templateStore.ensureTemplates(), configStore.ensureConfigs()]);
		await Promise.all(
			templateStore.templates
				.filter((template) => questionCountOf(template.id) === null)
				.map((template) => questionStore.fetchQuestions(template.id)),
		);
	}

	async function createTemplate(name = DEFAULT_TEMPLATE_NAME): Promise<TemplateActionResult> {
		const created = await templateStore.createTemplate({
			name: name.trim() || DEFAULT_TEMPLATE_NAME,
		});
		if (!created) {
			return { success: false, message: templateStore.error ?? "Não foi possível criar o modelo." };
		}
		questionStore.initializeEmpty(created.id);
		return { success: true, message: "Modelo criado.", templateId: created.id };
	}

	async function removeTemplate(templateId: string): Promise<TemplateActionResult> {
		const removed = await templateStore.removeTemplate(templateId);
		if (!removed) {
			return {
				success: false,
				message: templateStore.error ?? "Não foi possível excluir o modelo.",
			};
		}
		// A agenda e as perguntas caíram em cascata no back; o cache local acompanha.
		await configStore.fetchConfigs();
		delete questionStore.questionsByTemplateId[templateId];
		return { success: true, message: "Modelo excluído." };
	}

	return {
		options,
		hasLoaded: computed(() => templateStore.hasLoaded),
		isLoading: computed(() => templateStore.isLoading),
		questionCountOf,
		load,
		createTemplate,
		removeTemplate,
	};
}
