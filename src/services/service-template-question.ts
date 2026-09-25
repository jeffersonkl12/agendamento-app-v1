import { http } from "@services/http";

export type QuestionType = "TEXT" | "SINGLE" | "MULTI" | "NUMBER" | "BOOLEAN";

export interface QuestionOption {
	id: string;
	questionId: string;
	label: string;
	price: number | null;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface ServiceTemplateQuestion {
	id: string;
	templateId: string;
	title: string;
	type: QuestionType;
	required: boolean;
	order: number;
	unitPrice: number | null;
	options: QuestionOption[];
	createdAt: string;
	updatedAt: string;
}

export interface CreateQuestionOptionInput {
	label: string;
	price?: number;
}

export interface CreateServiceTemplateQuestionInput {
	title: string;
	type: QuestionType;
	order: number;
	required?: boolean;
	options?: CreateQuestionOptionInput[];
	booleanPrices?: { yes?: number; no?: number };
	unitPrice?: number;
}

export type UpdateServiceTemplateQuestionInput = Partial<CreateServiceTemplateQuestionInput>;

export async function listServiceTemplateQuestions(templateId: string) {
	const { data } = await http.get<ServiceTemplateQuestion[]>(
		`/service-templates/${templateId}/questions`,
	);
	return data;
}

export async function createServiceTemplateQuestion(
	templateId: string,
	input: CreateServiceTemplateQuestionInput,
) {
	const { data } = await http.post<ServiceTemplateQuestion>(
		`/service-templates/${templateId}/questions`,
		input,
	);
	return data;
}

export async function updateServiceTemplateQuestion(
	id: string,
	input: UpdateServiceTemplateQuestionInput,
) {
	const { data } = await http.patch<ServiceTemplateQuestion>(`/questions/${id}`, input);
	return data;
}

export async function deleteServiceTemplateQuestion(id: string) {
	await http.delete(`/questions/${id}`);
}
