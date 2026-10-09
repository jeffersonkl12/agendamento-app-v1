import { useRequestState } from "@composables/useRequestState";
import { getMe, type PublicUser, type UpdateUserInput, updateMe } from "@services/user";
import { defineStore } from "pinia";
import { ref } from "vue";

// Perfil do profissional logado (GET/PATCH /users/me). `tradeName` é o nome do negócio.
export const useUserStore = defineStore("user", () => {
	const profile = ref<PublicUser | null>(null);
	const hasLoaded = ref(false);
	const { isLoading, error, errorStatus, run } = useRequestState();

	async function fetchMe() {
		const result = await run(() => getMe());
		if (result) {
			profile.value = result;
			hasLoaded.value = true;
		}
		return result;
	}

	async function ensureMe() {
		if (!hasLoaded.value) await fetchMe();
		return profile.value;
	}

	async function updateProfile(input: UpdateUserInput) {
		const result = await run(() => updateMe(input));
		if (result) profile.value = result;
		return result;
	}

	return { profile, hasLoaded, isLoading, error, errorStatus, fetchMe, ensureMe, updateProfile };
});
