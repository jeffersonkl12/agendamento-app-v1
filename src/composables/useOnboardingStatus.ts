import { useBusinessProfileStore } from "@stores/business-profile";
import { useSchedulingConfigStore } from "@stores/scheduling-config";
import { useServiceTemplateQuestionStore } from "@stores/service-template-question";
import { computed, ref } from "vue";

export interface OnboardingPendingItem {
	id: string;
	label: string;
	to: string;
}

/**
 * Checklist de "bot pronto" (dashboard-api-routes.md §3): o bot só agenda quando perfil,
 * configuração de agenda, modelo em uso e pelo menos uma pergunta do modelo existem.
 */
export function useOnboardingStatus() {
	const businessProfileStore = useBusinessProfileStore();
	const schedulingConfigStore = useSchedulingConfigStore();
	const questionStore = useServiceTemplateQuestionStore();

	const isLoaded = ref(false);

	const hasBusinessProfile = computed(() => businessProfileStore.profile !== null);
	const hasSchedulingConfig = computed(() => schedulingConfigStore.config !== null);

	const activeTemplateId = computed(() => schedulingConfigStore.config?.activeTemplateId ?? null);
	const hasActiveTemplate = computed(() => activeTemplateId.value !== null);

	const activeTemplateQuestions = computed(() => {
		if (!activeTemplateId.value) return [];
		return questionStore.questionsByTemplateId[activeTemplateId.value] ?? [];
	});

	const activeTemplateHasQuestions = computed(() => activeTemplateQuestions.value.length > 0);

	const isBotReady = computed(
		() =>
			hasBusinessProfile.value &&
			hasSchedulingConfig.value &&
			hasActiveTemplate.value &&
			activeTemplateHasQuestions.value,
	);

	// Na ordem do onboarding (§3), cada item aponta pra tela que resolve a pendência.
	const pendingItems = computed<OnboardingPendingItem[]>(() => {
		const items: OnboardingPendingItem[] = [];
		if (!hasBusinessProfile.value) {
			items.push({ id: "profile", label: "Cadastre o nome do seu negócio", to: "/perfil" });
		}
		if (!hasSchedulingConfig.value) {
			items.push({
				id: "config",
				label: "Defina dias e horários de atendimento",
				to: "/configurar-agendamentos",
			});
		}
		if (!hasActiveTemplate.value) {
			items.push({
				id: "template",
				label: "Escolha o modelo de atendimento usado pelo bot",
				to: "/configurar-agendamentos",
			});
		} else if (!activeTemplateHasQuestions.value) {
			items.push({
				id: "questions",
				label: "Adicione ao menos uma pergunta ao modelo em uso",
				to: `/modelo-atendimento/${activeTemplateId.value}`,
			});
		}
		return items;
	});

	async function loadStatus() {
		await Promise.all([
			businessProfileStore.ensureMyProfile(),
			schedulingConfigStore.ensureMyConfig(),
		]);
		if (activeTemplateId.value) {
			await questionStore.fetchQuestions(activeTemplateId.value);
		}
		isLoaded.value = true;
	}

	return {
		hasBusinessProfile,
		hasSchedulingConfig,
		hasActiveTemplate,
		activeTemplateHasQuestions,
		isBotReady,
		isLoaded,
		pendingItems,
		loadStatus,
	};
}
