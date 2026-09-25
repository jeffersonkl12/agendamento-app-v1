import { DEFAULT_TIMEZONE } from "@composables/useProviderTimezone";
import { useServiceTemplates } from "@composables/useServiceTemplates";
import { formatTime } from "@libs/format";
import type { SchedulingConfig } from "@services/scheduling-config";
import { useSchedulingConfigStore } from "@stores/scheduling-config";
import { computed, onMounted, ref, watch } from "vue";

export const WEEKDAYS = [
	{ key: "mondayEnabled", label: "Seg" },
	{ key: "tuesdayEnabled", label: "Ter" },
	{ key: "wednesdayEnabled", label: "Qua" },
	{ key: "thursdayEnabled", label: "Qui" },
	{ key: "fridayEnabled", label: "Sex" },
	{ key: "saturdayEnabled", label: "Sáb" },
	{ key: "sundayEnabled", label: "Dom" },
] as const satisfies readonly { key: keyof SchedulingConfig; label: string }[];

export type WeekdayKey = (typeof WEEKDAYS)[number]["key"];

export interface ScheduleHours {
	startTime: string;
	endTime: string;
	intervalMinutes: number;
}

export interface SchedulingSaveResult {
	success: boolean;
	message: string;
}

// §8/§12#5: o servidor ainda não valida — a UI restringe a 06:00–22:00 em passos de 30 min
// e o intervalo a 15/30/45/60.
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

const DEFAULT_ENABLED_DAYS: WeekdayKey[] = [
	"mondayEnabled",
	"tuesdayEnabled",
	"wednesdayEnabled",
	"thursdayEnabled",
	"fridayEnabled",
];
const DEFAULT_HOURS: ScheduleHours = { startTime: "09:00", endTime: "18:00", intervalMinutes: 30 };

/**
 * Configuração de agendamento (dashboard-api-routes.md §8): mantém um rascunho editável e só
 * publica no "Salvar" — POST se ainda não existe, PATCH se já existe (§1.3, §12#2). Valida no front
 * o que o servidor ainda não valida (§12#4/#5).
 */
export function useSchedulingConfigForm() {
	const configStore = useSchedulingConfigStore();
	const templates = useServiceTemplates();

	const enabledDays = ref<WeekdayKey[]>([...DEFAULT_ENABLED_DAYS]);
	const hours = ref<ScheduleHours>({ ...DEFAULT_HOURS });
	const activeTemplateId = ref<string | null>(null);

	function resetFromConfig(config: SchedulingConfig | null) {
		if (!config) return;
		enabledDays.value = WEEKDAYS.filter((day) => config[day.key]).map((day) => day.key);
		// A API devolve HH:MM:SS, mas recebe e os selects usam HH:MM (§1.1).
		hours.value = {
			startTime: formatTime(config.startTime),
			endTime: formatTime(config.endTime),
			intervalMinutes: config.intervalMinutes,
		};
		activeTemplateId.value = config.activeTemplateId;
	}

	watch(() => configStore.config, resetFromConfig, { immediate: true });

	const hoursLabel = computed(
		() =>
			`${hours.value.startTime} às ${hours.value.endTime} · intervalo ${hours.value.intervalMinutes} min`,
	);

	const selectedTemplate = computed(
		() => templates.options.value.find((option) => option.id === activeTemplateId.value) ?? null,
	);

	const templateWarning = computed(() => {
		if (!activeTemplateId.value) {
			return "Nenhum modelo escolhido: o bot não vai oferecer agendamentos.";
		}
		if (selectedTemplate.value?.questionCount === 0) {
			return "Este modelo não tem perguntas. Adicione ao menos uma para o bot conseguir agendar.";
		}
		return null;
	});

	function validate(): string | null {
		if (enabledDays.value.length === 0) return "Selecione ao menos um dia da semana.";
		if (hours.value.endTime <= hours.value.startTime) {
			return "O horário de fim precisa ser depois do início.";
		}
		// §12#4: o servidor aceita modelo sem perguntas, mas o bot não funciona com ele (RN-C03).
		if (selectedTemplate.value?.questionCount === 0) {
			return "O modelo escolhido não tem perguntas. Adicione perguntas ou escolha outro modelo.";
		}
		return null;
	}

	async function save(): Promise<SchedulingSaveResult> {
		const validationError = validate();
		if (validationError) return { success: false, message: validationError };

		const dayFlags = Object.fromEntries(
			WEEKDAYS.map((day) => [day.key, enabledDays.value.includes(day.key)]),
		) as Record<WeekdayKey, boolean>;

		const input = {
			...dayFlags,
			...hours.value,
			activeTemplateId: activeTemplateId.value,
			timezone: configStore.config?.timezone ?? DEFAULT_TIMEZONE,
		};

		const result = configStore.config
			? await configStore.updateConfig(input)
			: await configStore.createConfig(input);

		if (!result) {
			return { success: false, message: configStore.error ?? "Não foi possível salvar." };
		}
		// RN-C04: mudar dias/horários não cancela agendamentos já existentes fora da nova janela.
		return {
			success: true,
			message: "Configuração salva. Agendamentos já marcados não foram alterados.",
		};
	}

	return {
		enabledDays,
		hours,
		activeTemplateId,
		hoursLabel,
		selectedTemplate,
		templateWarning,
		isSaving: computed(() => configStore.isLoading),
		isInitialLoading: computed(() => !configStore.hasLoaded && configStore.isLoading),
		save,
	};
}

/** Carrega configuração e modelos ao montar. Chamado uma vez, pela página. */
export function useSchedulingConfigFormSync() {
	const configStore = useSchedulingConfigStore();
	const templates = useServiceTemplates();

	onMounted(() => Promise.all([configStore.ensureMyConfig(), templates.load()]));
}
