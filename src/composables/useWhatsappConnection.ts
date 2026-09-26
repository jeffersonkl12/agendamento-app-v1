import { useBusinessProfileStore } from "@stores/business-profile";
import { useIntervalFn } from "@vueuse/core";
import { computed } from "vue";

const STATUS_POLL_INTERVAL_MS = 3000;
// A Evolution API pode levar alguns segundos pra gerar o QR code depois de criar a instância;
// nesse intervalo o connect devolve 500 (dashboard-api-routes.md §12#12). Reintentar em silêncio
// antes de mostrar erro pro prestador.
const CONNECT_RETRY_DELAYS_MS = [1000, 2000];

export interface WhatsappActionResult {
	success: boolean;
	message: string;
}

function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Conexão do WhatsApp via Evolution API (dashboard-api-routes.md §4): gera QR code, faz polling do
 * status enquanto ele está visível e permite desconectar. `isConnected` deriva de
 * `profile.whatsappInstanceName` — a única fonte de verdade persistida.
 */
export function useWhatsappConnection() {
	const store = useBusinessProfileStore();

	const isConnected = computed(() => store.profile?.whatsappInstanceName != null);
	const qrCodeBase64 = computed(() => store.whatsappQrCode);
	const pairingCode = computed(() => store.whatsappPairingCode);
	const isGeneratingQr = computed(() => store.isLoading && !store.whatsappQrCode);

	async function connect(phoneNumber?: string): Promise<WhatsappActionResult> {
		const normalizedPhone = phoneNumber?.trim() || undefined;
		let recreatedForPairing = false;

		for (let attempt = 0; ; attempt++) {
			const result = await store.connectWhatsapp(normalizedPhone);

			if (result) {
				// §4: o pairingCode só nasce junto com a instância. Se já existia uma pendente criada
				// sem telefone, pedir o código agora devolve pairingCode nulo — refaz do zero uma vez.
				if (normalizedPhone && !result.pairingCode && !recreatedForPairing) {
					recreatedForPairing = true;
					await store.disconnectWhatsapp();
					continue;
				}
				return { success: true, message: "Código de conexão gerado." };
			}

			if (store.errorStatus === 409) {
				await store.fetchMyProfile();
				return { success: false, message: "Esse WhatsApp já está conectado." };
			}

			if (store.errorStatus === 500 && attempt < CONNECT_RETRY_DELAYS_MS.length) {
				await wait(CONNECT_RETRY_DELAYS_MS[attempt]);
				continue;
			}

			return {
				success: false,
				message: store.error ?? "Não foi possível gerar o QR code. Tente novamente.",
			};
		}
	}

	async function pollStatus() {
		const wasConnected = store.whatsappIsConnected;
		await store.refreshWhatsappStatus();
		if (!wasConnected && store.whatsappIsConnected) {
			await store.fetchMyProfile();
			pause();
		}
	}

	const { pause, resume } = useIntervalFn(pollStatus, STATUS_POLL_INTERVAL_MS, {
		immediate: false,
	});

	async function disconnect(): Promise<WhatsappActionResult> {
		const succeeded = await store.disconnectWhatsapp();
		if (!succeeded) {
			return { success: false, message: store.error ?? "Não foi possível desconectar." };
		}
		return { success: true, message: "WhatsApp desconectado." };
	}

	return {
		isConnected,
		qrCodeBase64,
		pairingCode,
		isGeneratingQr,
		errorMessage: computed(() => store.error),
		connect,
		disconnect,
		startPolling: resume,
		stopPolling: pause,
	};
}
