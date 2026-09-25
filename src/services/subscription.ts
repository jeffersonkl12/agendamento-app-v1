import { http } from "@services/http";

export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELED";

export interface Subscription {
	id: string;
	businessOwnerId: string;
	planName: string;
	price: number;
	renewalDate: string;
	status: SubscriptionStatus;
	createdAt: string;
	updatedAt: string;
}

// Só leitura no painel (RN-PF02): criar/alterar assinatura é fluxo de cobrança, não do prestador.
export async function getMySubscription() {
	const { data } = await http.get<Subscription>("/subscriptions/me");
	return data;
}
