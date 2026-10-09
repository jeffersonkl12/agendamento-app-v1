import { useSchedulingConfigStore } from "@stores/scheduling-config";
import { computed } from "vue";

export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

/**
 * Fuso do profissional (back-api.md §5.4): cada serviço tem o seu na configuração de agenda. Um
 * agendamento é exibido no fuso do serviço dele; "hoje" e "este mês" usam o fuso do primeiro serviço
 * configurado — `America/Sao_Paulo` enquanto não há nenhum. Nunca o fuso do navegador.
 */
export function useProviderTimezone() {
	const configStore = useSchedulingConfigStore();

	const timezone = computed(() => configStore.configs[0]?.timezone ?? DEFAULT_TIMEZONE);

	function timezoneOf(templateId: string | null): string {
		const config = templateId ? configStore.configByTemplateId.get(templateId) : undefined;
		return config?.timezone ?? timezone.value;
	}

	return { timezone, timezoneOf };
}
