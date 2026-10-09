import { useRequestState } from "@composables/useRequestState";
import {
	type CreateQuestionOptionInput,
	createQuestionOption,
	deleteQuestionOption,
	listQuestionOptions,
	type QuestionOption,
	type UpdateQuestionOptionInput,
	updateQuestionOption,
} from "@services/question-option";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useQuestionOptionStore = defineStore("question-option", () => {
	const optionsByQuestionId = ref<Record<string, QuestionOption[]>>({});
	const { isLoading, error, errorStatus, run } = useRequestState();

	async function fetchOptions(questionId: string) {
		const result = await run(() => listQuestionOptions(questionId));
		if (result) optionsByQuestionId.value[questionId] = result;
		return result;
	}

	async function createOption(input: CreateQuestionOptionInput) {
		const result = await run(() => createQuestionOption(input));
		if (result) {
			const current = optionsByQuestionId.value[input.questionId] ?? [];
			optionsByQuestionId.value[input.questionId] = [...current, result];
		}
		return result;
	}

	async function updateOption(questionId: string, id: string, input: UpdateQuestionOptionInput) {
		const result = await run(() => updateQuestionOption(id, input));
		if (result) {
			const current = optionsByQuestionId.value[questionId] ?? [];
			optionsByQuestionId.value[questionId] = current.map((option) =>
				option.id === id ? result : option,
			);
		}
		return result;
	}

	async function removeOption(questionId: string, id: string) {
		let succeeded = false;
		await run(async () => {
			await deleteQuestionOption(id);
			succeeded = true;
		});
		if (succeeded) {
			const current = optionsByQuestionId.value[questionId] ?? [];
			optionsByQuestionId.value[questionId] = current.filter((option) => option.id !== id);
		}
		return succeeded;
	}

	/** Descarta o cache da pergunta — usado ao excluí-la (as opções caem em cascata no back). */
	function forget(questionId: string) {
		delete optionsByQuestionId.value[questionId];
	}

	return {
		optionsByQuestionId,
		isLoading,
		error,
		errorStatus,
		fetchOptions,
		createOption,
		updateOption,
		removeOption,
		forget,
	};
});
