import type { ServiceTemplateQuestion } from "@services/service-template-question";
import { computed, type Ref } from "vue";

export type QuestionAnswerValue =
	| { type: "SINGLE"; optionId: string }
	| { type: "MULTI"; optionIds: string[] }
	| { type: "NUMBER"; quantity: number }
	| { type: "BOOLEAN"; value: "yes" | "no" }
	| { type: "TEXT" };

export type QuestionAnswers = Record<string, QuestionAnswerValue>;

/**
 * Simulador de preço do modelo (dashboard-api-routes.md §7.7): só ilustrativo no painel,
 * o valor real é sempre recalculado pelo servidor no momento do agendamento.
 */
export function useServiceTemplatePricing(
	basePrice: Ref<number>,
	questions: Ref<ServiceTemplateQuestion[]>,
	answers: Ref<QuestionAnswers>,
) {
	const questionsTotal = computed(() => {
		let total = 0;

		for (const question of questions.value) {
			const answer = answers.value[question.id];
			if (!answer) continue;

			if (answer.type === "SINGLE") {
				const option = question.options.find((opt) => opt.id === answer.optionId);
				total += option?.price ?? 0;
			}

			if (answer.type === "MULTI") {
				for (const optionId of answer.optionIds) {
					const option = question.options.find((opt) => opt.id === optionId);
					total += option?.price ?? 0;
				}
			}

			if (answer.type === "BOOLEAN") {
				const label = answer.value === "yes" ? "Sim" : "Não";
				const option = question.options.find((opt) => opt.label === label);
				total += option?.price ?? 0;
			}

			if (answer.type === "NUMBER" && question.unitPrice) {
				total += answer.quantity * question.unitPrice;
			}
		}

		return total;
	});

	const total = computed(() => basePrice.value + questionsTotal.value);

	return { questionsTotal, total };
}
