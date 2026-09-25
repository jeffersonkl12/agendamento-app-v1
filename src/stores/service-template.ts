import { useRequestState } from "@composables/useRequestState";
import {
	type CreateServiceTemplateInput,
	createServiceTemplate,
	deleteServiceTemplate,
	listServiceTemplates,
	type ServiceTemplate,
	type UpdateServiceTemplateInput,
	updateServiceTemplate,
} from "@services/service-template";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useServiceTemplateStore = defineStore("service-template", () => {
	const templates = ref<ServiceTemplate[]>([]);
	const hasLoaded = ref(false);
	const { isLoading, error, errorStatus, run } = useRequestState();

	const templateById = computed(() => {
		const map = new Map<string, ServiceTemplate>();
		for (const template of templates.value) {
			map.set(template.id, template);
		}
		return map;
	});

	async function fetchTemplates() {
		const result = await run(() => listServiceTemplates());
		if (result) {
			templates.value = result;
			hasLoaded.value = true;
		}
		return result;
	}

	async function ensureTemplates() {
		if (!hasLoaded.value) await fetchTemplates();
		return templates.value;
	}

	async function createTemplate(input: CreateServiceTemplateInput) {
		const result = await run(() => createServiceTemplate(input));
		if (result) templates.value.push(result);
		return result;
	}

	async function updateTemplate(id: string, input: UpdateServiceTemplateInput) {
		const result = await run(() => updateServiceTemplate(id, input));
		if (result) {
			const index = templates.value.findIndex((template) => template.id === id);
			if (index !== -1) templates.value[index] = result;
		}
		return result;
	}

	async function removeTemplate(id: string) {
		let succeeded = false;
		await run(async () => {
			await deleteServiceTemplate(id);
			succeeded = true;
		});
		if (succeeded) {
			templates.value = templates.value.filter((template) => template.id !== id);
		}
		return succeeded;
	}

	return {
		templates,
		templateById,
		hasLoaded,
		isLoading,
		error,
		errorStatus,
		fetchTemplates,
		ensureTemplates,
		createTemplate,
		updateTemplate,
		removeTemplate,
	};
});
