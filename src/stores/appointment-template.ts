import { useRequestState } from "@composables/useRequestState";
import {
	type AppointmentTemplate,
	type CreateAppointmentTemplateInput,
	createAppointmentTemplate,
	deleteAppointmentTemplate,
	listAppointmentTemplates,
	type UpdateAppointmentTemplateInput,
	updateAppointmentTemplate,
} from "@services/appointment-template";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

// Os "serviços" do profissional (back-api.md §5.3).
export const useAppointmentTemplateStore = defineStore("appointment-template", () => {
	const templates = ref<AppointmentTemplate[]>([]);
	const hasLoaded = ref(false);
	const { isLoading, error, errorStatus, run } = useRequestState();

	const templateById = computed(() => {
		const map = new Map<string, AppointmentTemplate>();
		for (const template of templates.value) {
			map.set(template.id, template);
		}
		return map;
	});

	async function fetchTemplates() {
		const result = await run(() => listAppointmentTemplates());
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

	async function createTemplate(input: CreateAppointmentTemplateInput) {
		const result = await run(() => createAppointmentTemplate(input));
		if (result) templates.value.push(result);
		return result;
	}

	async function updateTemplate(id: string, input: UpdateAppointmentTemplateInput) {
		const result = await run(() => updateAppointmentTemplate(id, input));
		if (result) {
			const index = templates.value.findIndex((template) => template.id === id);
			if (index !== -1) templates.value[index] = result;
		}
		return result;
	}

	async function removeTemplate(id: string) {
		let succeeded = false;
		await run(async () => {
			await deleteAppointmentTemplate(id);
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
