import { DEFAULT_TIMEZONE } from "@composables/useProviderTimezone";
import { useServiceTemplates } from "@composables/useServiceTemplates";
import { formatTime } from "@libs/format";
import type { SchedulingConfig, Weekday } from "@services/scheduling-config";
import { useSchedulingConfigStore } from "@stores/scheduling-config";
import { computed, onMounted, ref, watch } from "vue";

export const WEEKDAYS = [
	{ key: "monday", label: "Seg" },
	{ key: "tuesday", label: "Ter" },
	{ key: "wednesday", label: "Qua" },
	{ key: "thursday", label: "Qui" },
	{ key: "friday", label: "Sex" },
	{ key: "saturday", label: "Sáb" },
	{ key: "sunday", label: "Dom" },
] as const satisfies readonly { key: Weekday; label: string }[];

export type WeekdayKey = Weekday;

export interface ScheduleHours {
	startTime: string;
	endTime: string;
	/** `null` = qualquer horário livre dentro do expediente. */
	intervalMinutes: number | null;
}

export interface SchedulingSaveResult {
	success: boolean;
	message: string;
}

// A API aceita qualquer HH:mm (§5.4); a UI restringe a 06:00–22:00 em passos de 30 min e o
// intervalo a 15/30/45/60 pra manter a grade de horários simples de escolher.
function buildTimeOptions(): string[] {
	const times: string[] = [];
	for (let minutes = 6 * 60; minutes <= 22 * 60; minutes += 30) {
		const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
		const mins = String(minutes % 60).padStart(2, "0");
		times.push(`${hours}:${mins}`);
	}
	return times;
}

export const TIME_OPTIONS = buildTimeOptions();
export const INTERVAL_OPTIONS = [15, 30, 45, 60] as const;

const DEFAULT_OPEN_DAYS: WeekdayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const DEFAULT_HOURS: ScheduleHours = { startTime: "09:00", endTime: "18:00", intervalMinutes: 30 };

/**
 * Configuração de agenda de UM serviço (back-api.md §5.4): mantém um rascunho editável do serviço
 * selecionado e só publica no "Salvar" — POST se o serviço ainda não tem agenda, PATCH se já tem.
 */
export function useSchedulingConfigForm() {
	const configStore = useSchedulingConfigStore();
	const templates = useServiceTemplates();

	const selectedTemplateId = ref<string | null>(null);
	const openDays = ref<WeekdayKey[]>([...DEFAULT_OPEN_DAYS]);
	const hours = ref<ScheduleHours>({ ...DEFAULT_HOURS });

	const config = computed(() =>
		selectedTemplateId.value
			? configStore.configByTemplateId.get(selectedTemplateId.value)
			: undefined,
	);

	// Sem escolha explícita, abre o primeiro serviço assim que a lista chega.
	watch(
		() => templates.options.value,
		(options) => {
			const stillExists = options.some((option) => option.id === selectedTemplateId.value);
			if (!stillExists) selectedTemplateId.value = options[0]?.id ?? null;
		},
		{ immediate: true },
	);

	function resetFromConfig(current: SchedulingConfig | undefined) {
		openDays.value = current ? [...current.openDays] : [...DEFAULT_OPEN_DAYS];
		// A API devolve HH:mm:ss, mas recebe e os selects usam HH:mm (§1).
		hours.value = current
			? {
					startTime: formatTime(current.openTime),
					endTime: formatTime(current.closeTime),
					intervalMinutes: current.intervalMinutes,
				}
			: { ...DEFAULT_HOURS };
	}

	// Trocar de serviço (ou a config chegar/mudar) recarrega o rascunho; edição não salva é descartada.
	watch(config, resetFromConfig, { immediate: true });

	const hoursLabel = computed(() => {
		const interval =
			hours.value.intervalMinutes === null
				? "qualquer horário livre"
				: `intervalo ${hours.value.intervalMinutes} min`;
		return `${hours.value.startTime} às ${hours.value.endTime} · ${interval}`;
	});

	const selectedTemplate = computed(
		() => templates.options.value.find((option) => option.id === selectedTemplateId.value) ?? null,
	);

	const templateWarning = computed(() => {
		if (!selectedTemplate.value) {
			return "Você ainda não tem serviços. Crie um para configurar a agenda.";
		}
		if (!config.value) {
			return "Este serviço ainda não tem agenda: o assistente só oferece horários depois que você salvar.";
		}
		return null;
	});

	function validate(): string | null {
		if (!selectedTemplateId.value) return "Crie um serviço antes de configurar a agenda.";
		if (openDays.value.length === 0) return "Selecione ao menos um dia da semana.";
		if (hours.value.endTime <= hours.value.startTime) {
			return "O horário de fim precisa ser depois do início.";
		}
		return null;
	}

	async function save(): Promise<SchedulingSaveResult> {
		const validationError = validate();
		if (validationError || !selectedTemplateId.value) {
			return { success: false, message: validationError ?? "Escolha um serviço." };
		}

		const input = {
			openDays: WEEKDAYS.filter((day) => openDays.value.includes(day.key)).map((day) => day.key),
			openTime: hours.value.startTime,
			closeTime: hours.value.endTime,
			intervalMinutes: hours.value.intervalMinutes,
		};

		const result = config.value
			? await configStore.updateConfig(config.value.id, input)
			: await configStore.createConfig({
					...input,
					templateId: selectedTemplateId.value,
					timezone: DEFAULT_TIMEZONE,
				});

		if (!result) {
			// 409: o serviço já tinha agenda (criada em outra aba); recarrega pra o próximo salvar fazer PATCH.
			if (configStore.errorStatus === 409) {
				await configStore.fetchConfigs();
				return {
					success: false,
					message: "Este serviço já tinha uma agenda. Revise e salve de novo.",
				};
			}
			return { success: false, message: configStore.error ?? "Não foi possível salvar." };
		}
		// RN-C04: mudar dias/horários não cancela agendamentos já existentes fora da nova janela.
		return {
			success: true,
			message: "Agenda salva. Agendamentos já marcados não foram alterados.",
		};
	}

	return {
		selectedTemplateId,
		openDays,
		hours,
		hoursLabel,
		selectedTemplate,
		templateWarning,
		isSaving: computed(() => configStore.isLoading),
		isInitialLoading: computed(() => !configStore.hasLoaded && configStore.isLoading),
		save,
	};
}

/** Carrega agendas e serviços ao montar. Chamado uma vez, pela página. */
export function useSchedulingConfigFormSync() {
	const configStore = useSchedulingConfigStore();
	const templates = useServiceTemplates();

	onMounted(() => Promise.all([configStore.ensureConfigs(), templates.load()]));
}
