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
import { ref } from "vue";

export const useServiceTemplateStore = defineStore("service-template", () => {
	const templates = ref<ServiceTemplate[]>([]);
	const { isLoading, error, run } = useRequestState();

	async function fetchTemplates() {
		const result = await run(() => listServiceTemplates());
		if (result) templates.value = result;
		return result;
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
		isLoading,
		error,
		fetchTemplates,
		createTemplate,
		updateTemplate,
		removeTemplate,
	};
});
