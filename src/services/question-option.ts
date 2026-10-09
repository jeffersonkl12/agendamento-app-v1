import { http } from "@services/http";

/** Alternativa de uma pergunta single_choice/multiple_choice. Não tem createdAt/updatedAt. */
export interface QuestionOption {
	id: string;
	questionId: string;
	label: string;
	position: number;
	/** `null` ou `0` = grátis. */
	priceInCents: number | null;
}

export interface CreateQuestionOptionInput {
	questionId: string;
	label: string;
	position: number;
	priceInCents?: number | null;
}

// `questionId` é imutável.
export type UpdateQuestionOptionInput = Partial<Omit<CreateQuestionOptionInput, "questionId">>;

export async function listQuestionOptions(questionId: string) {
	const { data } = await http.get<QuestionOption[]>("/question-options", {
		params: { questionId },
	});
	return data;
}

export async function createQuestionOption(input: CreateQuestionOptionInput) {
	const { data } = await http.post<QuestionOption>("/question-options", input);
	return data;
}

export async function updateQuestionOption(id: string, input: UpdateQuestionOptionInput) {
	const { data } = await http.patch<QuestionOption>(`/question-options/${id}`, input);
	return data;
}

export async function deleteQuestionOption(id: string) {
	await http.delete(`/question-options/${id}`);
}
