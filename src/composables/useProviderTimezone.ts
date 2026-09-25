import { useSchedulingConfigStore } from "@stores/scheduling-config";
import { computed } from "vue";

export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

/**
 * Fuso do prestador (dashboard-api-routes.md §1.1): vem da configuração de agendamento, com
 * `America/Sao_Paulo` enquanto ela não existe. "Hoje" e "este mês" usam esse fuso, não o do navegador.
 */
export function useProviderTimezone() {
	const configStore = useSchedulingConfigStore();
	return computed(() => configStore.config?.timezone ?? DEFAULT_TIMEZONE);
}
