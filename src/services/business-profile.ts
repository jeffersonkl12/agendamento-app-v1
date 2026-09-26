import { http } from "@services/http";

export interface BusinessProfile {
	id: string;
	businessOwnerId: string;
	businessName: string;
	photoUrl: string | null;
	whatsappInstanceName: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateBusinessProfileInput {
	businessName: string;
	photoUrl?: string | null;
}

export interface UpdateBusinessProfileInput {
	businessName?: string;
	photoUrl?: string | null;
}

export async function getMyBusinessProfile() {
	const { data } = await http.get<BusinessProfile>("/business-profiles/me");
	return data;
}

export async function createBusinessProfile(input: CreateBusinessProfileInput) {
	const { data } = await http.post<BusinessProfile>("/business-profiles", input);
	return data;
}

export async function updateMyBusinessProfile(input: UpdateBusinessProfileInput) {
	const { data } = await http.patch<BusinessProfile>("/business-profiles/me", input);
	return data;
}

export type WhatsappConnectionState = "connecting" | "open" | "close";

export interface WhatsappConnectResponse {
	qrCodeBase64: string;
	// Só vem preenchido quando `phoneNumber` foi enviado E a instância nasceu nessa chamada (§4).
	pairingCode?: string | null;
	connectionState: WhatsappConnectionState;
	isConnected: boolean;
}

export interface WhatsappStatusResponse {
	connectionState: WhatsappConnectionState;
	isConnected: boolean;
}

export async function connectWhatsapp(phoneNumber?: string) {
	const { data } = await http.post<WhatsappConnectResponse>(
		"/business-profiles/me/whatsapp/connect",
		phoneNumber ? { phoneNumber } : undefined,
	);
	return data;
}

export async function getWhatsappStatus() {
	const { data } = await http.get<WhatsappStatusResponse>("/business-profiles/me/whatsapp/status");
	return data;
}

export async function disconnectWhatsapp() {
	await http.delete("/business-profiles/me/whatsapp");
}
