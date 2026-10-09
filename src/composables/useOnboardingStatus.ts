import { useAppointmentTemplateStore } from "@stores/appointment-template";
import { useSchedulingConfigStore } from "@stores/scheduling-config";
import { useUserStore } from "@stores/user";
import { useWhatsappStore } from "@stores/whatsapp";
import { computed, ref } from "vue";

export interface OnboardingPendingItem {
	id: string;
	label: string;
	to: string;
}

/**
 * Checklist de "assistente pronto" (back-api.md §7.1): o assistente só atende com o WhatsApp
 * conectado e só oferece horários de serviços que têm agenda configurada. O perfil completo
 * (nome do negócio e telefone) fecha o onboarding; o questionário do serviço é opcional.
 */
export function useOnboardingStatus() {
	const userStore = useUserStore();
	const whatsappStore = useWhatsappStore();
	const templateStore = useAppointmentTemplateStore();
	const configStore = useSchedulingConfigStore();

	const isLoaded = ref(false);

	const hasCompleteProfile = computed(
		() => !!userStore.profile?.tradeName && !!userStore.profile?.phone,
	);
	const hasWhatsappConnected = computed(() => whatsappStore.status === "connected");
	const hasService = computed(() => templateStore.templates.length > 0);

	const templatesWithoutSchedule = computed(() =>
		templateStore.templates.filter((template) => !configStore.configByTemplateId.has(template.id)),
	);
	const hasSchedulableService = computed(
		() =>
			hasService.value && templatesWithoutSchedule.value.length < templateStore.templates.length,
	);

	const isBotReady = computed(
		() => hasWhatsappConnected.value && hasSchedulableService.value && hasCompleteProfile.value,
	);

	// Na ordem do onboarding (§7.1), cada item aponta pra tela que resolve a pendência.
	const pendingItems = computed<OnboardingPendingItem[]>(() => {
		const items: OnboardingPendingItem[] = [];
		if (!hasCompleteProfile.value) {
			items.push({
				id: "profile",
				label: "Complete o nome do negócio e o telefone",
				to: "/perfil",
			});
		}
		if (!hasWhatsappConnected.value) {
			items.push({ id: "whatsapp", label: "Conecte o WhatsApp do seu negócio", to: "/perfil" });
		}
		if (!hasService.value) {
			items.push({ id: "service", label: "Crie seu primeiro serviço", to: "/modelo-atendimento" });
		} else if (!hasSchedulableService.value) {
			items.push({
				id: "schedule",
				label: "Defina dias e horários de atendimento de um serviço",
				to: "/configurar-agendamentos",
			});
		}
		return items;
	});

	async function loadStatus() {
		await Promise.all([
			userStore.ensureMe(),
			whatsappStore.fetchStatus(),
			templateStore.ensureTemplates(),
			configStore.ensureConfigs(),
		]);
		isLoaded.value = true;
	}

	return {
		hasCompleteProfile,
		hasWhatsappConnected,
		hasService,
		hasSchedulableService,
		isBotReady,
		isLoaded,
		pendingItems,
		loadStatus,
	};
}
