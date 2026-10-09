import { useRequestState } from "@composables/useRequestState";
import {
	type CreateTemplateQuestionInput,
	createTemplateQuestion,
	deleteTemplateQuestion,
	listTemplateQuestions,
	type TemplateQuestion,
	type UpdateTemplateQuestionInput,
	updateTemplateQuestion,
} from "@services/template-question";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useTemplateQuestionStore = defineStore("template-question", () => {
	const questionsByTemplateId = ref<Record<string, TemplateQuestion[]>>({});
	const { isLoading, error, errorStatus, run } = useRequestState();

	async function fetchQuestions(templateId: string) {
		const result = await run(() => listTemplateQuestions(templateId));
		if (result) questionsByTemplateId.value[templateId] = result;
		return result;
	}

	/** Serviço recém-criado não tem perguntas — evita um GET só pra descobrir uma lista vazia. */
	function initializeEmpty(templateId: string) {
		questionsByTemplateId.value[templateId] = [];
	}

	async function createQuestion(input: CreateTemplateQuestionInput) {
		const result = await run(() => createTemplateQuestion(input));
		if (result) {
			const current = questionsByTemplateId.value[input.templateId] ?? [];
			questionsByTemplateId.value[input.templateId] = [...current, result];
		}
		return result;
	}

	async function updateQuestion(
		templateId: string,
		id: string,
		input: UpdateTemplateQuestionInput,
	) {
		const result = await run(() => updateTemplateQuestion(id, input));
		if (result) {
			const current = questionsByTemplateId.value[templateId] ?? [];
			questionsByTemplateId.value[templateId] = current.map((question) =>
				question.id === id ? result : question,
			);
		}
		return result;
	}

	async function removeQuestion(templateId: string, id: string) {
		let succeeded = false;
		await run(async () => {
			await deleteTemplateQuestion(id);
			succeeded = true;
		});
		if (succeeded) {
			const current = questionsByTemplateId.value[templateId] ?? [];
			questionsByTemplateId.value[templateId] = current.filter((question) => question.id !== id);
		}
		return succeeded;
	}

	return {
		questionsByTemplateId,
		isLoading,
		error,
		errorStatus,
		fetchQuestions,
		initializeEmpty,
		createQuestion,
		updateQuestion,
		removeQuestion,
	};
});
