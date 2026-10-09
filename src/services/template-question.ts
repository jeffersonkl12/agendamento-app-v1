import { http } from "@services/http";

export type QuestionType = "free_text" | "single_choice" | "multiple_choice" | "number" | "yes_no";

export interface TemplateQuestion {
	id: string;
	templateId: string;
	label: string;
	type: QuestionType;
	isRequired: boolean;
	/** Ordem de exibição, a partir de 0. */
	position: number;
	/** Deve ser `null` em single_choice/multiple_choice — o preço fica nas opções. */
	priceInCents: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateTemplateQuestionInput {
	templateId: string;
	label: string;
	type: QuestionType;
	position: number;
	isRequired?: boolean;
	priceInCents?: number | null;
}

// `templateId` é imutável.
export type UpdateTemplateQuestionInput = Partial<Omit<CreateTemplateQuestionInput, "templateId">>;

export async function listTemplateQuestions(templateId: string) {
	const { data } = await http.get<TemplateQuestion[]>("/template-questions", {
		params: { templateId },
	});
	return data;
}

export async function createTemplateQuestion(input: CreateTemplateQuestionInput) {
	const { data } = await http.post<TemplateQuestion>("/template-questions", input);
	return data;
}

export async function updateTemplateQuestion(id: string, input: UpdateTemplateQuestionInput) {
	const { data } = await http.patch<TemplateQuestion>(`/template-questions/${id}`, input);
	return data;
}

export async function deleteTemplateQuestion(id: string) {
	await http.delete(`/template-questions/${id}`);
}
