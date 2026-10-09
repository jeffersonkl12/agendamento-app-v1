import { useRequestState } from "@composables/useRequestState";
import {
	connectWhatsapp as connectWhatsappService,
	disconnectWhatsapp as disconnectWhatsappService,
	getWhatsappConnection,
	type WhatsappConnectionInfo,
	type WhatsappConnectionStatus,
} from "@services/whatsapp";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useWhatsappStore = defineStore("whatsapp", () => {
	const status = ref<WhatsappConnectionStatus | null>(null);
	// QR code e pairing code só existem na resposta do POST; o GET devolve apenas o status.
	const qrCode = ref<string | null>(null);
	const pairingCode = ref<string | null>(null);
	const { isLoading, error, errorStatus, run } = useRequestState();

	function applyConnection(info: WhatsappConnectionInfo) {
		status.value = info.status;
		qrCode.value = info.qrCode ?? null;
		pairingCode.value = info.pairingCode ?? null;
	}

	async function fetchStatus() {
		const result = await run(() => getWhatsappConnection());
		if (result) {
			status.value = result.status;
			// Só o status "connected" invalida o QR/código. Enquanto aguarda a leitura o GET pode
			// devolver "disconnected", e limpar aqui faria o código de pareamento sumir da tela.
			if (result.status === "connected") {
				qrCode.value = null;
				pairingCode.value = null;
			}
		}
		return result;
	}

	async function connect(phoneNumber?: string) {
		const result = await run(() => connectWhatsappService(phoneNumber));
		if (result) applyConnection(result);
		return result;
	}

	async function disconnect() {
		let succeeded = false;
		await run(async () => {
			await disconnectWhatsappService();
			succeeded = true;
		});
		if (succeeded) {
			status.value = "not_created";
			qrCode.value = null;
			pairingCode.value = null;
		}
		return succeeded;
	}

	return {
		status,
		qrCode,
		pairingCode,
		isLoading,
		error,
		errorStatus,
		fetchStatus,
		connect,
		disconnect,
	};
});
