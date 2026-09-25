import { useRequestState } from "@composables/useRequestState";
import {
	type BusinessProfile,
	type CreateBusinessProfileInput,
	createBusinessProfile,
	getMyBusinessProfile,
	type UpdateBusinessProfileInput,
	updateMyBusinessProfile,
} from "@services/business-profile";
import { isNotFoundError } from "@services/http";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useBusinessProfileStore = defineStore("business-profile", () => {
	const profile = ref<BusinessProfile | null>(null);
	const { isLoading, error, run } = useRequestState();

	async function fetchMyProfile() {
		const result = await run(() => getMyBusinessProfile(), { onError: isNotFoundError });
		profile.value = result ?? null;
		return result;
	}

	async function createProfile(input: CreateBusinessProfileInput) {
		const result = await run(() => createBusinessProfile(input));
		if (result) profile.value = result;
		return result;
	}

	async function updateProfile(input: UpdateBusinessProfileInput) {
		const result = await run(() => updateMyBusinessProfile(input));
		if (result) profile.value = result;
		return result;
	}

	return { profile, isLoading, error, fetchMyProfile, createProfile, updateProfile };
});
