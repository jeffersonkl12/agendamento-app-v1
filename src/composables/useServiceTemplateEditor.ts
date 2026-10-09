import { useServiceTemplates } from "@composables/useServiceTemplates";
import { centsToReais, reaisToCents } from "@libs/format";
import type { QuestionOption } from "@services/question-option";
import type { QuestionType, TemplateQuestion } from "@services/template-question";
import { useAppointmentTemplateStore } from "@stores/appointment-template";
import { useQuestionOptionStore } from "@stores/question-option";
import { useSchedulingConfigStore } from "@stores/scheduling-config";
import { useTemplateQuestionStore } from "@stores/template-question";
import { computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

export type { QuestionType };

export interface QuestionDraftOption {
	/** Presente = opção já salva (PATCH); ausente = nova (POST). */
	id?: string;
	label: string;
	/** Valor em reais, como digitado. Vazio = sem custo extra. */
	price: string;
}

/** Dados do formulário de pergunta, com preços em reais como digitados. */
export interface QuestionDraft {
	title: string;
	required: boolean;
	type: QuestionType;
	/** Só em single_choice/multiple_choice. */
	options: QuestionDraftOption[];
	/** Preço da pergunta nos demais tipos (por unidade em `number`, se "sim" em `yes_no`). */
	price: string;
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

const CHOICE_TYPES: readonly QuestionType[] = ["single_choice", "multiple_choice"];

function isChoice(type: QuestionType): boolean {
	return CHOICE_TYPES.includes(type);
}

/** Vazio ou zero vira `null` — a API trata ausência de preço como `null`. */
function toPriceInCents(value: string): number | null {
	const cents = reaisToCents(value);
	return cents > 0 ? cents : null;
}

function toPriceDraft(cents: number | null): string {
	return cents != null && cents > 0 ? String(centsToReais(cents)) : "";
}

/** Opções sem rótulo são descartadas (RN-P03), pra validar RN-P02 antes de chamar a API. */
function labeledOptions(draft: QuestionDraft): QuestionDraftOption[] {
	return draft.options.filter((option) => option.label.trim());
}

/**
 * Corpo comum a criação e edição. Pergunta de escolha leva `priceInCents: null` — o preço fica nas
 * opções (back-api.md §5.5) — e as opções vão por chamadas próprias.
 */
function toQuestionPayload(draft: QuestionDraft) {
	return {
		label: draft.title.trim(),
		type: draft.type,
		isRequired: draft.required,
		priceInCents: isChoice(draft.type) ? null : toPriceInCents(draft.price),
	};
}

function toQuestionDraft(question: TemplateQuestion, options: QuestionOption[]): QuestionDraft {
	const sortedOptions = [...options].sort((a, b) => a.position - b.position);
	const hasOptions = isChoice(question.type) && sortedOptions.length > 0;

	return {
		title: question.label,
		required: question.isRequired,
		type: question.type,
		options: hasOptions
			? sortedOptions.map((option) => ({
					id: option.id,
					label: option.label,
					price: toPriceDraft(option.priceInCents),
				}))
			: [
					{ label: "", price: "" },
					{ label: "", price: "" },
				],
		price: isChoice(question.type) ? "" : toPriceDraft(question.priceInCents),
	};
}

function validateDraft(draft: QuestionDraft): string | null {
	if (!draft.title.trim()) return "Informe a pergunta.";
	if (isChoice(draft.type) && labeledOptions(draft).length === 0) {
		return "Adicione ao menos uma opção com nome."; // RN-P02
	}
	return null;
}

/**
 * Editor do serviço (back-api.md §5.3, §5.5, §5.6). Sem id na rota, abre o primeiro serviço; sem
 * nenhum, fica vazio pra oferecer a criação.
 */
export function useServiceTemplateEditor() {
	const route = useRoute();
	const templateStore = useAppointmentTemplateStore();
	const questionStore = useTemplateQuestionStore();
	const optionStore = useQuestionOptionStore();
	const templates = useServiceTemplates();

	const requestedTemplateId = computed(() =>
		typeof route.params.id === "string" && route.params.id ? route.params.id : null,
	);

	const template = computed(() => {
		if (requestedTemplateId.value) {
			return templateStore.templateById.get(requestedTemplateId.value) ?? null;
		}
		return templateStore.templates[0] ?? null;
	});

	const isInitialLoading = computed(() => !templateStore.hasLoaded && templateStore.isLoading);
	const isNotFound = computed(
		() => templateStore.hasLoaded && requestedTemplateId.value !== null && template.value === null,
	);
	const hasNoTemplates = computed(
		() => templateStore.hasLoaded && templateStore.templates.length === 0,
	);

	const basePriceReais = computed(() =>
		template.value ? centsToReais(template.value.basePriceInCents ?? 0) : 0,
	);

	const storedQuestions = computed(() =>
		template.value ? (questionStore.questionsByTemplateId[template.value.id] ?? []) : [],
	);

	const questions = computed<QuestionListItem[]>(() =>
		[...storedQuestions.value]
			.sort((a, b) => a.position - b.position)
			.map(({ id, label, type, isRequired }) => ({
				id,
				title: label,
				type,
				required: isRequired,
			})),
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
		const basePriceInCents = toPriceInCents(String(value));
		if (basePriceInCents === (template.value.basePriceInCents ?? null)) return null;

		const result = await templateStore.updateTemplate(template.value.id, { basePriceInCents });
		if (!result)
			return { success: false, message: templateStore.error ?? "Não foi possível salvar." };
		return { success: true, message: "Valor base atualizado." };
	}

	/** Cria, atualiza e remove as opções pra o servidor ficar igual ao draft (cada opção é um recurso). */
	async function syncOptions(questionId: string, draft: QuestionDraft): Promise<boolean> {
		const existing = optionStore.optionsByQuestionId[questionId] ?? [];
		const wanted = isChoice(draft.type) ? labeledOptions(draft) : [];
		const keptIds = new Set(wanted.flatMap((option) => (option.id ? [option.id] : [])));

		for (const option of existing) {
			if (keptIds.has(option.id)) continue;
			if (!(await optionStore.removeOption(questionId, option.id))) return false;
		}

		for (const [position, option] of wanted.entries()) {
			const label = option.label.trim();
			const priceInCents = toPriceInCents(option.price);
			const saved = existing.find((candidate) => candidate.id === option.id);

			if (!saved) {
				const created = await optionStore.createOption({
					questionId,
					label,
					position,
					priceInCents,
				});
				if (!created) return false;
				continue;
			}
			const unchanged =
				saved.label === label &&
				saved.position === position &&
				(saved.priceInCents ?? null) === priceInCents;
			if (unchanged) continue;
			const updated = await optionStore.updateOption(questionId, saved.id, {
				label,
				position,
				priceInCents,
			});
			if (!updated) return false;
		}
		return true;
	}

	/** Falha no meio de uma sequência de chamadas: recarrega do servidor pra tela não mostrar meio-termo. */
	async function resyncQuestion(templateId: string, questionId: string | null) {
		await questionStore.fetchQuestions(templateId);
		if (questionId) await optionStore.fetchOptions(questionId);
	}

	async function addQuestion(draft: QuestionDraft): Promise<EditorActionResult> {
		if (!template.value) return { success: false, message: "Modelo não encontrado." };
		const validationError = validateDraft(draft);
		if (validationError) return { success: false, message: validationError };

		// O servidor não reindexa: a nova pergunta entra depois da última (posições a partir de 0).
		const nextPosition =
			storedQuestions.value.reduce((max, question) => Math.max(max, question.position), -1) + 1;
		const created = await questionStore.createQuestion({
			templateId: template.value.id,
			position: nextPosition,
			...toQuestionPayload(draft),
		});
		if (!created)
			return { success: false, message: questionStore.error ?? "Não foi possível salvar." };

		if (isChoice(draft.type) && !(await syncOptions(created.id, draft))) {
			const message = optionStore.error ?? "Não foi possível salvar as opções.";
			await resyncQuestion(template.value.id, created.id);
			return { success: false, message };
		}
		return { success: true, message: "Pergunta adicionada." };
	}

	function questionDraft(questionId: string): QuestionDraft | null {
		const question = storedQuestions.value.find((candidate) => candidate.id === questionId);
		if (!question) return null;
		return toQuestionDraft(question, optionStore.optionsByQuestionId[questionId] ?? []);
	}

	async function editQuestion(
		questionId: string,
		draft: QuestionDraft,
	): Promise<EditorActionResult> {
		if (!template.value) return { success: false, message: "Modelo não encontrado." };
		const validationError = validateDraft(draft);
		if (validationError) return { success: false, message: validationError };

		const templateId = template.value.id;
		const updated = await questionStore.updateQuestion(
			templateId,
			questionId,
			toQuestionPayload(draft),
		);
		if (!updated)
			return { success: false, message: questionStore.error ?? "Não foi possível salvar." };

		if (!(await syncOptions(questionId, draft))) {
			const message = optionStore.error ?? "Não foi possível salvar as opções.";
			await resyncQuestion(templateId, questionId);
			return { success: false, message };
		}
		return { success: true, message: "Pergunta atualizada." };
	}

	async function removeQuestion(questionId: string): Promise<EditorActionResult> {
		if (!template.value) return { success: false, message: "Modelo não encontrado." };
		const removed = await questionStore.removeQuestion(template.value.id, questionId);
		if (!removed) {
			return { success: false, message: questionStore.error ?? "Não foi possível excluir." };
		}
		optionStore.forget(questionId);
		return { success: true, message: "Pergunta excluída." };
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
		basePriceReais,
		questions,
		isSavingTemplate: computed(() => templateStore.isLoading),
		isQuestionsBusy: computed(() => questionStore.isLoading || optionStore.isLoading),
		rename,
		updateBasePrice,
		addQuestion,
		questionDraft,
		editQuestion,
		removeQuestion,
		removeTemplate,
		createTemplate: templates.createTemplate,
	};
}

/** Carrega serviços/agendas ao montar e as perguntas (e opções) do serviço aberto. Chamado uma vez, pela página. */
export function useServiceTemplateEditorSync() {
	const templateStore = useAppointmentTemplateStore();
	const configStore = useSchedulingConfigStore();
	const questionStore = useTemplateQuestionStore();
	const optionStore = useQuestionOptionStore();
	const { template } = useServiceTemplateEditor();

	onMounted(() => Promise.all([templateStore.ensureTemplates(), configStore.ensureConfigs()]));

	// Opções são um recurso por pergunta (§7.3): uma chamada por pergunta de escolha.
	async function loadTemplate(templateId: string) {
		const questions = await questionStore.fetchQuestions(templateId);
		await Promise.all(
			(questions ?? [])
				.filter((question) => isChoice(question.type))
				.map((question) => optionStore.fetchOptions(question.id)),
		);
	}

	watch(
		() => template.value?.id,
		(templateId) => {
			if (templateId) loadTemplate(templateId);
		},
		{ immediate: true },
	);
}
