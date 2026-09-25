import { useBusinessProfileStore } from "@stores/business-profile";
import { useSchedulingConfigStore } from "@stores/scheduling-config";
import { useServiceTemplateQuestionStore } from "@stores/service-template-question";
import { computed } from "vue";

/**
 * Checklist de "bot pronto" (dashboard-api-routes.md §3): o bot só agenda quando perfil,
 * configuração de agenda, modelo em uso e pelo menos uma pergunta do modelo existem.
 */
export function useOnboardingStatus() {
	const businessProfileStore = useBusinessProfileStore();
	const schedulingConfigStore = useSchedulingConfigStore();
	const questionStore = useServiceTemplateQuestionStore();

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

	async function loadStatus() {
		await Promise.all([
			businessProfileStore.fetchMyProfile(),
			schedulingConfigStore.fetchMyConfig(),
		]);
		if (activeTemplateId.value) {
			await questionStore.fetchQuestions(activeTemplateId.value);
		}
	}

	return {
		hasBusinessProfile,
		hasSchedulingConfig,
		hasActiveTemplate,
		activeTemplateHasQuestions,
		isBotReady,
		loadStatus,
	};
}
