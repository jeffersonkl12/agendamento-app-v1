import type { QuestionOption } from "@services/question-option";
import type { TemplateQuestion } from "@services/template-question";
import { computed, type Ref } from "vue";

export type QuestionAnswerValue =
	| { type: "single_choice"; optionId: string }
	| { type: "multiple_choice"; optionIds: string[] }
	| { type: "number"; quantity: number }
	| { type: "yes_no"; value: boolean }
	| { type: "free_text"; text: string };

export type QuestionAnswers = Record<string, QuestionAnswerValue>;

/**
 * Simulador de preço do serviço (back-api.md §5.5): só ilustrativo no painel, quem calcula o valor
 * real na reserva é o assistente.
 * - free_text: cobra uma vez, se respondida
 * - number: preço × quantidade
 * - yes_no: só se a resposta for "sim"
 * - single_choice / multiple_choice: preço da(s) opção(ões) escolhida(s)
 */
export function useServiceTemplatePricing(
	basePriceInCents: Ref<number>,
	questions: Ref<TemplateQuestion[]>,
	optionsByQuestionId: Ref<Record<string, QuestionOption[]>>,
	answers: Ref<QuestionAnswers>,
) {
	const questionsTotal = computed(() => {
		let total = 0;

		for (const question of questions.value) {
			const answer = answers.value[question.id];
			if (!answer) continue;

			const options = optionsByQuestionId.value[question.id] ?? [];
			const optionPrice = (optionId: string) =>
				options.find((option) => option.id === optionId)?.priceInCents ?? 0;
			const price = question.priceInCents ?? 0;

			if (answer.type === "single_choice") total += optionPrice(answer.optionId);
			if (answer.type === "multiple_choice") {
				for (const optionId of answer.optionIds) total += optionPrice(optionId);
			}
			if (answer.type === "number") total += answer.quantity * price;
			if (answer.type === "yes_no" && answer.value) total += price;
			if (answer.type === "free_text" && answer.text.trim()) total += price;
		}

		return total;
	});

	const total = computed(() => basePriceInCents.value + questionsTotal.value);

	return { questionsTotal, total };
}
