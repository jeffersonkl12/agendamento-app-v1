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
