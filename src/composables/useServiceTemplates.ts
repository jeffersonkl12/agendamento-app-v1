import { useSchedulingConfigStore } from "@stores/scheduling-config";
import { useServiceTemplateStore } from "@stores/service-template";
import { useServiceTemplateQuestionStore } from "@stores/service-template-question";
import { computed } from "vue";

export interface ServiceTemplateOption {
	id: string;
	name: string;
	/** `null` enquanto as perguntas do modelo não foram carregadas. */
	questionCount: number | null;
	isInUse: boolean;
}

export interface TemplateActionResult {
	success: boolean;
	message: string;
	templateId?: string;
}

const DEFAULT_TEMPLATE_NAME = "Novo modelo";

/**
 * Modelos de atendimento do prestador (dashboard-api-routes.md §6): vários modelos, só um em uso
 * (`activeTemplateId` da configuração). Excluir é bloqueado pro modelo em uso, e a API devolve 500
 * pra modelo já usado em agendamentos (§12#3) — mapeado aqui pra uma mensagem compreensível.
 */
export function useServiceTemplates() {
	const templateStore = useServiceTemplateStore();
	const questionStore = useServiceTemplateQuestionStore();
	const configStore = useSchedulingConfigStore();

	const activeTemplateId = computed(() => configStore.config?.activeTemplateId ?? null);

	function questionCountOf(templateId: string): number | null {
		return questionStore.questionsByTemplateId[templateId]?.length ?? null;
	}

	const options = computed<ServiceTemplateOption[]>(() =>
		templateStore.templates.map((template) => ({
			id: template.id,
			name: template.name,
			questionCount: questionCountOf(template.id),
			isInUse: template.id === activeTemplateId.value,
		})),
	);

	function isInUse(templateId: string): boolean {
		return templateId === activeTemplateId.value;
	}

	// GET /service-templates não traz perguntas (§6); a contagem vem de uma chamada por modelo.
	// O volume de modelos por prestador é pequeno, então o custo é aceitável.
	async function load() {
		await Promise.all([templateStore.ensureTemplates(), configStore.ensureMyConfig()]);
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
		if (isInUse(templateId)) {
			return {
				success: false,
				message:
					"Este modelo está em uso. Escolha outro em Configurar agendamentos antes de excluir.",
			};
		}
		const removed = await templateStore.removeTemplate(templateId);
		if (removed) return { success: true, message: "Modelo excluído." };
		if (templateStore.errorStatus === 500 || templateStore.errorStatus === 409) {
			return {
				success: false,
				message: "Este modelo já foi usado em agendamentos e não pode ser excluído.",
			};
		}
		return { success: false, message: templateStore.error ?? "Não foi possível excluir o modelo." };
	}

	return {
		options,
		activeTemplateId,
		hasLoaded: computed(() => templateStore.hasLoaded),
		isLoading: computed(() => templateStore.isLoading),
		isInUse,
		questionCountOf,
		load,
		createTemplate,
		removeTemplate,
	};
}
