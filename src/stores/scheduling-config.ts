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
	const hasLoaded = ref(false);
	const { isLoading, error, errorStatus, run } = useRequestState();

	async function fetchMyConfig() {
		const result = await run(() => getMySchedulingConfig(), { onError: isNotFoundError });
		config.value = result ?? null;
		// 404 é estado válido ("ainda não criada") — conta como carregado.
		hasLoaded.value = error.value === null;
		return result;
	}

	async function ensureMyConfig() {
		if (!hasLoaded.value) await fetchMyConfig();
		return config.value;
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

	return {
		config,
		hasLoaded,
		isLoading,
		error,
		errorStatus,
		fetchMyConfig,
		ensureMyConfig,
		createConfig,
		updateConfig,
	};
});
