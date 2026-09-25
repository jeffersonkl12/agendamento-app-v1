import { useServiceTemplates } from "@composables/useServiceTemplates";
import { centsToReais, reaisToCents } from "@libs/format";
import type {
	CreateServiceTemplateQuestionInput,
	QuestionType,
} from "@services/service-template-question";
import { useSchedulingConfigStore } from "@stores/scheduling-config";
import { useServiceTemplateStore } from "@stores/service-template";
import { useServiceTemplateQuestionStore } from "@stores/service-template-question";
import { computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

export type { QuestionType };

export interface QuestionDraftOption {
	label: string;
	/** Valor em reais, como digitado. Vazio = sem custo extra. */
	price: string;
}

/** Dados do formulário de nova pergunta, com preços em reais como digitados. */
export interface QuestionDraft {
	title: string;
	required: boolean;
	type: QuestionType;
	options: QuestionDraftOption[];
	unitPrice: string;
	yesPrice: string;
	noPrice: string;
}

export interface QuestionListItem {
	id: string;
	title: string;
	type: QuestionType;
	required: boolean;
}

export interface EditorActionResult {
	success: boolean;
	message: string;
}

const CHOICE_TYPES: readonly QuestionType[] = ["SINGLE", "MULTI"];

function optionalCents(value: string): number | undefined {
	const cents = reaisToCents(value);
	return cents > 0 ? cents : undefined;
}

/**
 * Monta o corpo do POST de pergunta (§7.2) mandando só os campos que o tipo usa — o servidor
 * normaliza de qualquer jeito (§7.3), mas o payload fica honesto. Opções sem rótulo são descartadas
 * aqui também (RN-P03), assim a validação RN-P02 é feita antes da chamada.
 */
function toCreateQuestionInput(
	draft: QuestionDraft,
	order: number,
): CreateServiceTemplateQuestionInput {
	const base = { title: draft.title.trim(), type: draft.type, required: draft.required, order };

	if (CHOICE_TYPES.includes(draft.type)) {
		const options = draft.options
			.filter((option) => option.label.trim())
			.map((option) => ({ label: option.label.trim(), price: optionalCents(option.price) }));
		return { ...base, options };
	}
	if (draft.type === "NUMBER") {
		return { ...base, unitPrice: optionalCents(draft.unitPrice) };
	}
	if (draft.type === "BOOLEAN") {
		return {
			...base,
			booleanPrices: { yes: optionalCents(draft.yesPrice), no: optionalCents(draft.noPrice) },
		};
	}
	return base;
}

function validateDraft(draft: QuestionDraft): string | null {
	if (!draft.title.trim()) return "Informe a pergunta.";
	const hasLabeledOption = draft.options.some((option) => option.label.trim());
	if (CHOICE_TYPES.includes(draft.type) && !hasLabeledOption) {
		return "Adicione ao menos uma opção com nome."; // RN-P02
	}
	return null;
}

/**
 * Editor do modelo de atendimento (dashboard-api-routes.md §6/§7). Sem id na rota, abre o modelo em
 * uso; sem modelo em uso, o primeiro da lista; sem nenhum, fica vazio pra oferecer a criação.
 */
export function useServiceTemplateEditor() {
	const route = useRoute();
	const templateStore = useServiceTemplateStore();
	const questionStore = useServiceTemplateQuestionStore();
	const configStore = useSchedulingConfigStore();
	const templates = useServiceTemplates();

	const requestedTemplateId = computed(() =>
		typeof route.params.id === "string" && route.params.id ? route.params.id : null,
	);

	const template = computed(() => {
		if (requestedTemplateId.value) {
			return templateStore.templateById.get(requestedTemplateId.value) ?? null;
		}
		const activeId = configStore.config?.activeTemplateId;
		const active = activeId ? templateStore.templateById.get(activeId) : undefined;
		return active ?? templateStore.templates[0] ?? null;
	});

	const isInitialLoading = computed(() => !templateStore.hasLoaded && templateStore.isLoading);
	const isNotFound = computed(
		() => templateStore.hasLoaded && requestedTemplateId.value !== null && template.value === null,
	);
	const hasNoTemplates = computed(
		() => templateStore.hasLoaded && templateStore.templates.length === 0,
	);

	const isInUse = computed(() => (template.value ? templates.isInUse(template.value.id) : false));
	const basePriceReais = computed(() =>
		template.value ? centsToReais(template.value.basePrice) : 0,
	);

	const questions = computed<QuestionListItem[]>(() => {
		if (!template.value) return [];
		const list = questionStore.questionsByTemplateId[template.value.id] ?? [];
		return [...list]
			.sort((a, b) => a.order - b.order)
			.map(({ id, title, type, required }) => ({ id, title, type, required }));
	});

	// RN-C03: sem perguntas no modelo em uso, o bot para de agendar.
	const isLastQuestionOfActiveTemplate = computed(
		() => isInUse.value && questions.value.length === 1,
	);

	async function rename(name: string): Promise<EditorActionResult> {
		const trimmed = name.trim();
		if (!template.value) return { success: false, message: "Modelo não encontrado." };
		if (!trimmed) return { success: false, message: "Informe o nome do modelo." };
		if (trimmed === template.value.name) return { success: true, message: "Nome atualizado." };

		const result = await templateStore.updateTemplate(template.value.id, { name: trimmed });
		if (!result)
			return { success: false, message: templateStore.error ?? "Não foi possível salvar." };
		return { success: true, message: "Nome atualizado." };
	}

	async function updateBasePrice(value: string | number): Promise<EditorActionResult | null> {
		if (!template.value) return null;
		const basePrice = reaisToCents(value);
		if (basePrice === template.value.basePrice) return null;

		const result = await templateStore.updateTemplate(template.value.id, { basePrice });
		if (!result)
			return { success: false, message: templateStore.error ?? "Não foi possível salvar." };
		return { success: true, message: "Valor base atualizado." };
	}

	async function addQuestion(draft: QuestionDraft): Promise<EditorActionResult> {
		if (!template.value) return { success: false, message: "Modelo não encontrado." };
		const validationError = validateDraft(draft);
		if (validationError) return { success: false, message: validationError };

		// §7.5: o servidor não reindexa — a nova pergunta entra depois da última (1, 2, 3...).
		const existing = questionStore.questionsByTemplateId[template.value.id] ?? [];
		const nextOrder = existing.reduce((max, question) => Math.max(max, question.order), 0) + 1;
		const input = toCreateQuestionInput(draft, nextOrder);

		const result = await questionStore.createQuestion(template.value.id, input);
		if (!result)
			return { success: false, message: questionStore.error ?? "Não foi possível salvar." };
		return { success: true, message: "Pergunta adicionada." };
	}

	async function removeQuestion(questionId: string): Promise<EditorActionResult> {
		if (!template.value) return { success: false, message: "Modelo não encontrado." };
		const wasLastOfActive = isLastQuestionOfActiveTemplate.value;
		const removed = await questionStore.removeQuestion(template.value.id, questionId);
		if (!removed) {
			return { success: false, message: questionStore.error ?? "Não foi possível excluir." };
		}
		return {
			success: true,
			message: wasLastOfActive
				? "Pergunta excluída. O modelo em uso ficou sem perguntas — o bot parou de agendar."
				: "Pergunta excluída.",
		};
	}

	async function removeTemplate(): Promise<EditorActionResult> {
		if (!template.value) return { success: false, message: "Modelo não encontrado." };
		return templates.removeTemplate(template.value.id);
	}

	return {
		template,
		isInitialLoading,
		isNotFound,
		hasNoTemplates,
		isInUse,
		basePriceReais,
		questions,
		isLastQuestionOfActiveTemplate,
		isSavingTemplate: computed(() => templateStore.isLoading),
		isQuestionsBusy: computed(() => questionStore.isLoading),
		rename,
		updateBasePrice,
		addQuestion,
		removeQuestion,
		removeTemplate,
		createTemplate: templates.createTemplate,
	};
}

/** Carrega modelos/configuração ao montar e as perguntas do modelo aberto. Chamado uma vez, pela página. */
export function useServiceTemplateEditorSync() {
	const templateStore = useServiceTemplateStore();
	const configStore = useSchedulingConfigStore();
	const questionStore = useServiceTemplateQuestionStore();
	const { template } = useServiceTemplateEditor();

	onMounted(() => Promise.all([templateStore.ensureTemplates(), configStore.ensureMyConfig()]));

	watch(
		() => template.value?.id,
		(templateId) => {
			if (templateId) questionStore.fetchQuestions(templateId);
		},
		{ immediate: true },
	);
}
