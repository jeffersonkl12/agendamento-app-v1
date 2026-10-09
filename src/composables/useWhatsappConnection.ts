import { useWhatsappStore } from "@stores/whatsapp";
import { useIntervalFn } from "@vueuse/core";
import { computed } from "vue";

const STATUS_POLL_INTERVAL_MS = 3000;

export interface WhatsappActionResult {
	success: boolean;
	message: string;
}

/**
 * Conexão do WhatsApp do profissional (back-api.md §4): gera QR code/código de pareamento, faz
 * polling do status (~3 s) enquanto o sheet está visível e permite desconectar.
 */
export function useWhatsappConnection() {
	const store = useWhatsappStore();

	const isConnected = computed(() => store.status === "connected");
	const qrCode = computed(() => store.qrCode);
	const pairingCode = computed(() => store.pairingCode);
	const isGeneratingQr = computed(() => store.isLoading && !store.qrCode);

	async function load() {
		await store.fetchStatus();
	}

	async function connect(phoneNumber?: string): Promise<WhatsappActionResult> {
		const normalizedPhone = phoneNumber?.trim() || undefined;
		let result = await store.connect(normalizedPhone);

		// A Evolution só gera o código de pareamento ao criar a instância com o número. Uma instância
		// pendente criada antes (sem número, ou com QR já girando) devolve `pairingCode` nulo: recria
		// do zero uma vez (DELETE + POST) pra o código nascer junto com a instância.
		if (result?.status === "connecting" && normalizedPhone && !result.pairingCode) {
			if (await store.disconnect()) result = await store.connect(normalizedPhone);
		}

		if (!result) {
			const message =
				store.errorStatus === 400
					? "Número de WhatsApp inválido. Informe DDI, DDD e o número."
					: (store.error ?? "Não foi possível gerar o QR code. Tente novamente.");
			return { success: false, message };
		}
		if (result.status === "connected") {
			return { success: true, message: "Esse WhatsApp já está conectado." };
		}
		return { success: true, message: "Código de conexão gerado." };
	}

	async function pollStatus() {
		await store.fetchStatus();
		if (store.status === "connected") pause();
	}

	const { pause, resume } = useIntervalFn(pollStatus, STATUS_POLL_INTERVAL_MS, {
		immediate: false,
	});

	async function disconnect(): Promise<WhatsappActionResult> {
		const succeeded = await store.disconnect();
		if (!succeeded) {
			return { success: false, message: store.error ?? "Não foi possível desconectar." };
		}
		return { success: true, message: "WhatsApp desconectado." };
	}

	return {
		isConnected,
		qrCode,
		pairingCode,
		isGeneratingQr,
		errorMessage: computed(() => store.error),
		load,
		connect,
		disconnect,
		startPolling: resume,
		stopPolling: pause,
	};
}
