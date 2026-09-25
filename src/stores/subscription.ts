import { useRequestState } from "@composables/useRequestState";
import { isNotFoundError } from "@services/http";
import { getMySubscription, type Subscription } from "@services/subscription";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useSubscriptionStore = defineStore("subscription", () => {
	const subscription = ref<Subscription | null>(null);
	const { isLoading, error, run } = useRequestState();

	async function fetchMySubscription() {
		const result = await run(() => getMySubscription(), { onError: isNotFoundError });
		subscription.value = result ?? null;
		return result;
	}

	return { subscription, isLoading, error, fetchMySubscription };
});
