import { formatCurrency, formatDayMonth } from "@libs/format";
import type { SubscriptionStatus } from "@services/subscription";
import { useSubscriptionStore } from "@stores/subscription";
import { computed } from "vue";

// RN-AS02/RN-AS03: fora de ACTIVE o bot para de aceitar agendamentos, mas o painel segue acessível.
const STATUS_WARNING: Record<Exclude<SubscriptionStatus, "ACTIVE">, string> = {
	PAST_DUE:
		"Pagamento pendente. O bot parou de aceitar novos agendamentos até a assinatura ser regularizada.",
	CANCELED:
		"Assinatura cancelada. O bot não aceita novos agendamentos, mas você ainda pode consultar o painel.",
};

/** Plano do prestador na tela de perfil — só leitura no painel (§5, RN-PF02). */
export function useSubscriptionSummary() {
	const store = useSubscriptionStore();

	const subscription = computed(() => store.subscription);

	const planName = computed(() => subscription.value?.planName ?? null);
	const priceLabel = computed(() =>
		subscription.value ? `${formatCurrency(subscription.value.price)}/mês` : null,
	);
	const renewalLabel = computed(() =>
		subscription.value ? `Renova em ${formatDayMonth(subscription.value.renewalDate)}` : null,
	);
	const statusWarning = computed(() => {
		const status = subscription.value?.status;
		return status && status !== "ACTIVE" ? STATUS_WARNING[status] : null;
	});

	return {
		hasSubscription: computed(() => subscription.value !== null),
		planName,
		priceLabel,
		renewalLabel,
		statusWarning,
		isInitialLoading: computed(() => !store.hasLoaded && store.isLoading),
		load: store.fetchMySubscription,
	};
}
