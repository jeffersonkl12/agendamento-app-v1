import { useRequestState } from "@composables/useRequestState";
import {
	type BusinessProfile,
	type CreateBusinessProfileInput,
	connectWhatsapp as connectWhatsappService,
	createBusinessProfile,
	disconnectWhatsapp as disconnectWhatsappService,
	getMyBusinessProfile,
	getWhatsappStatus as getWhatsappStatusService,
	type UpdateBusinessProfileInput,
	updateMyBusinessProfile,
	type WhatsappConnectionState,
} from "@services/business-profile";
import { isNotFoundError } from "@services/http";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useBusinessProfileStore = defineStore("business-profile", () => {
	const profile = ref<BusinessProfile | null>(null);
	const hasLoaded = ref(false);
	const { isLoading, error, errorStatus, run } = useRequestState();

	// Estado transitório da UI do QR (dashboard-api-routes.md §4) — não é dado de domínio
	// permanente, só pilota o sheet enquanto ele está aberto. `profile.whatsappInstanceName`
	// continua sendo a fonte de verdade persistida de "conectado".
	const whatsappQrCode = ref<string | null>(null);
	const whatsappPairingCode = ref<string | null>(null);
	const whatsappConnectionState = ref<WhatsappConnectionState | null>(null);
	const whatsappIsConnected = ref(false);

	async function fetchMyProfile() {
		const result = await run(() => getMyBusinessProfile(), { onError: isNotFoundError });
		profile.value = result ?? null;
		// 404 é estado válido ("ainda não criado") — conta como carregado.
		hasLoaded.value = error.value === null;
		return result;
	}

	async function ensureMyProfile() {
		if (!hasLoaded.value) await fetchMyProfile();
		return profile.value;
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

	async function connectWhatsapp(phoneNumber?: string) {
		const result = await run(() => connectWhatsappService(phoneNumber));
		if (result) {
			whatsappQrCode.value = result.qrCodeBase64;
			whatsappPairingCode.value = result.pairingCode ?? null;
			whatsappConnectionState.value = result.connectionState;
			whatsappIsConnected.value = result.isConnected;
		}
		return result;
	}

	async function refreshWhatsappStatus() {
		const result = await run(() => getWhatsappStatusService());
		if (result) {
			whatsappConnectionState.value = result.connectionState;
			whatsappIsConnected.value = result.isConnected;
		}
		return result;
	}

	async function disconnectWhatsapp() {
		await run(() => disconnectWhatsappService());
		const succeeded = error.value === null;
		if (succeeded) {
			whatsappQrCode.value = null;
			whatsappPairingCode.value = null;
			whatsappConnectionState.value = null;
			whatsappIsConnected.value = false;
			if (profile.value) profile.value = { ...profile.value, whatsappInstanceName: null };
		}
		return succeeded;
	}

	return {
		profile,
		hasLoaded,
		isLoading,
		error,
		errorStatus,
		whatsappQrCode,
		whatsappPairingCode,
		whatsappConnectionState,
		whatsappIsConnected,
		fetchMyProfile,
		ensureMyProfile,
		createProfile,
		updateProfile,
		connectWhatsapp,
		refreshWhatsappStatus,
		disconnectWhatsapp,
	};
});
