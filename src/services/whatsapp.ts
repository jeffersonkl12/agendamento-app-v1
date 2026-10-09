import { rootHttp } from "@services/http";

export type WhatsappConnectionStatus = "not_created" | "connecting" | "connected" | "disconnected";

export interface WhatsappConnectionInfo {
	status: WhatsappConnectionStatus;
	/** Data URL da imagem do QR code, presente enquanto aguarda a leitura. */
	qrCode?: string;
	/** Código pra digitar no WhatsApp; só vem quando `phoneNumber` foi enviado. */
	pairingCode?: string;
}

export async function getWhatsappConnection() {
	const { data } = await rootHttp.get<WhatsappConnectionInfo>("/api/whatsapp/connection");
	return data;
}

export async function connectWhatsapp(phoneNumber?: string) {
	const { data } = await rootHttp.post<WhatsappConnectionInfo>(
		"/api/whatsapp/connection",
		phoneNumber ? { phoneNumber } : undefined,
	);
	return data;
}

// Idempotente: devolve 204 mesmo sem instância.
export async function disconnectWhatsapp() {
	await rootHttp.delete("/api/whatsapp/connection");
}
