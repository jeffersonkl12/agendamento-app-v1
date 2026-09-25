import { useRequestState } from "@composables/useRequestState";
import { isNotFoundError } from "@services/http";
import {
	type CreateSchedulingConfigInput,
	createSchedulingConfig,
	getMySchedulingConfig,
	type SchedulingConfig,
	type UpdateSchedulingConfigInput,
	updateMySchedulingConfig,
} from "@services/scheduling-config";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useSchedulingConfigStore = defineStore("scheduling-config", () => {
	const config = ref<SchedulingConfig | null>(null);
	const { isLoading, error, run } = useRequestState();

	async function fetchMyConfig() {
		const result = await run(() => getMySchedulingConfig(), { onError: isNotFoundError });
		config.value = result ?? null;
		return result;
	}

	async function createConfig(input: CreateSchedulingConfigInput) {
		const result = await run(() => createSchedulingConfig(input));
		if (result) config.value = result;
		return result;
	}

	async function updateConfig(input: UpdateSchedulingConfigInput) {
		const result = await run(() => updateMySchedulingConfig(input));
		if (result) config.value = result;
		return result;
	}

	return { config, isLoading, error, fetchMyConfig, createConfig, updateConfig };
});
