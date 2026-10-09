import { useRequestState } from "@composables/useRequestState";
import {
	type Appointment,
	type AppointmentStatus,
	type ListAppointmentsParams,
	listAppointments,
	type UpdateAppointmentInput,
	updateAppointment,
} from "@services/appointment";
import { type AppointmentAnswer, listAppointmentAnswers } from "@services/appointment-answer";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useAppointmentStore = defineStore("appointment", () => {
	const appointments = ref<Appointment[]>([]);
	const answersByAppointmentId = ref<Record<string, AppointmentAnswer[]>>({});
	const hasLoaded = ref(false);
	const { isLoading, error, errorStatus, run } = useRequestState();

	async function fetchAppointments(params?: ListAppointmentsParams) {
		const result = await run(() => listAppointments(params));
		if (result) {
			appointments.value = result;
			hasLoaded.value = true;
		}
		return result;
	}

	async function fetchAnswers(appointmentId: string) {
		const result = await run(() => listAppointmentAnswers(appointmentId));
		if (result) answersByAppointmentId.value[appointmentId] = result;
		return result;
	}

	async function patchAppointment(id: string, input: UpdateAppointmentInput) {
		const result = await run(() => updateAppointment(id, input));
		if (result) {
			const index = appointments.value.findIndex((appointment) => appointment.id === id);
			if (index !== -1) appointments.value[index] = result;
		}
		return result;
	}

	function setStatus(id: string, status: AppointmentStatus) {
		return patchAppointment(id, { status });
	}

	return {
		appointments,
		answersByAppointmentId,
		hasLoaded,
		isLoading,
		error,
		errorStatus,
		fetchAppointments,
		fetchAnswers,
		patchAppointment,
		setStatus,
	};
});
