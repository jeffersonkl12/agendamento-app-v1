import { useRequestState } from "@composables/useRequestState";
import {
	type Appointment,
	type AppointmentDetail,
	cancelAppointment,
	confirmAppointment,
	getAppointment,
	listAppointments,
} from "@services/appointment";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useAppointmentStore = defineStore("appointment", () => {
	const appointments = ref<Appointment[]>([]);
	const detailsById = ref<Record<string, AppointmentDetail>>({});
	const hasLoaded = ref(false);
	const { isLoading, error, errorStatus, run } = useRequestState();

	async function fetchAppointments() {
		const result = await run(() => listAppointments());
		if (result) {
			appointments.value = result;
			hasLoaded.value = true;
		}
		return result;
	}

	async function fetchAppointmentDetail(id: string) {
		const result = await run(() => getAppointment(id));
		if (result) detailsById.value[id] = result;
		return result;
	}

	function applyStatusUpdate(updated: Appointment) {
		const index = appointments.value.findIndex((appointment) => appointment.id === updated.id);
		if (index !== -1) appointments.value[index] = updated;
		const detail = detailsById.value[updated.id];
		if (detail) detailsById.value[updated.id] = { ...detail, ...updated };
	}

	async function cancel(id: string) {
		const result = await run(() => cancelAppointment(id));
		if (result) applyStatusUpdate(result);
		return result;
	}

	async function confirm(id: string) {
		const result = await run(() => confirmAppointment(id));
		if (result) applyStatusUpdate(result);
		return result;
	}

	return {
		appointments,
		detailsById,
		hasLoaded,
		isLoading,
		error,
		errorStatus,
		fetchAppointments,
		fetchAppointmentDetail,
		cancel,
		confirm,
	};
});
