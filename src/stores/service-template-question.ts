import { useRequestState } from "@composables/useRequestState";
import {
	type CreateServiceTemplateQuestionInput,
	createServiceTemplateQuestion,
	deleteServiceTemplateQuestion,
	listServiceTemplateQuestions,
	type ServiceTemplateQuestion,
	type UpdateServiceTemplateQuestionInput,
	updateServiceTemplateQuestion,
} from "@services/service-template-question";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useServiceTemplateQuestionStore = defineStore("service-template-question", () => {
	const questionsByTemplateId = ref<Record<string, ServiceTemplateQuestion[]>>({});
	const { isLoading, error, run } = useRequestState();

	async function fetchQuestions(templateId: string) {
		const result = await run(() => listServiceTemplateQuestions(templateId));
		if (result) questionsByTemplateId.value[templateId] = result;
		return result;
	}

	async function createQuestion(templateId: string, input: CreateServiceTemplateQuestionInput) {
		const result = await run(() => createServiceTemplateQuestion(templateId, input));
		if (result) {
			const current = questionsByTemplateId.value[templateId] ?? [];
			questionsByTemplateId.value[templateId] = [...current, result];
		}
		return result;
	}

	async function updateQuestion(
		templateId: string,
		id: string,
		input: UpdateServiceTemplateQuestionInput,
	) {
		const result = await run(() => updateServiceTemplateQuestion(id, input));
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
			await deleteServiceTemplateQuestion(id);
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
		fetchQuestions,
		createQuestion,
		updateQuestion,
		removeQuestion,
	};
});
