import { useRequestState } from "@composables/useRequestState";
import {
	type CreateSchedulingConfigInput,
	createSchedulingConfig,
	deleteSchedulingConfig,
	listSchedulingConfigs,
	type SchedulingConfig,
	type UpdateSchedulingConfigInput,
	updateSchedulingConfig,
} from "@services/scheduling-config";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

// Uma configuração de agenda por serviço (back-api.md §5.4).
export const useSchedulingConfigStore = defineStore("scheduling-config", () => {
	const configs = ref<SchedulingConfig[]>([]);
	const hasLoaded = ref(false);
	const { isLoading, error, errorStatus, run } = useRequestState();

	const configByTemplateId = computed(() => {
		const map = new Map<string, SchedulingConfig>();
		for (const config of configs.value) {
			map.set(config.templateId, config);
		}
		return map;
	});

	async function fetchConfigs() {
		const result = await run(() => listSchedulingConfigs());
		if (result) {
			configs.value = result;
			hasLoaded.value = true;
		}
		return result;
	}

	async function ensureConfigs() {
		if (!hasLoaded.value) await fetchConfigs();
		return configs.value;
	}

	async function createConfig(input: CreateSchedulingConfigInput) {
		const result = await run(() => createSchedulingConfig(input));
		if (result) configs.value.push(result);
		return result;
	}

	async function updateConfig(id: string, input: UpdateSchedulingConfigInput) {
		const result = await run(() => updateSchedulingConfig(id, input));
		if (result) {
			const index = configs.value.findIndex((config) => config.id === id);
			if (index !== -1) configs.value[index] = result;
		}
		return result;
	}

	async function removeConfig(id: string) {
		let succeeded = false;
		await run(async () => {
			await deleteSchedulingConfig(id);
			succeeded = true;
		});
		if (succeeded) configs.value = configs.value.filter((config) => config.id !== id);
		return succeeded;
	}

	return {
		configs,
		configByTemplateId,
		hasLoaded,
		isLoading,
		error,
		errorStatus,
		fetchConfigs,
		ensureConfigs,
		createConfig,
		updateConfig,
		removeConfig,
	};
});
