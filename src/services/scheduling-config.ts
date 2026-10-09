import { http } from "@services/http";

export type Weekday =
	| "monday"
	| "tuesday"
	| "wednesday"
	| "thursday"
	| "friday"
	| "saturday"
	| "sunday";

/** Quando o profissional atende para UM serviço; no máximo uma por serviço (back-api.md §5.4). */
export interface SchedulingConfig {
	id: string;
	userId: string;
	templateId: string;
	openDays: Weekday[];
	/** Sempre `HH:mm:ss` na saída. */
	openTime: string;
	closeTime: string;
	/** `null` = qualquer horário livre dentro do expediente. */
	intervalMinutes: number | null;
	timezone: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateSchedulingConfigInput {
	templateId: string;
	openDays: Weekday[];
	/** `HH:mm` (ou `HH:mm:ss`). */
	openTime: string;
	closeTime: string;
	intervalMinutes?: number | null;
	/** Nome IANA; o padrão do back é `America/Sao_Paulo`. */
	timezone?: string;
}

// `templateId` é imutável.
export type UpdateSchedulingConfigInput = Partial<Omit<CreateSchedulingConfigInput, "templateId">>;

export async function listSchedulingConfigs() {
	const { data } = await http.get<SchedulingConfig[]>("/scheduling-configs");
	return data;
}

export async function createSchedulingConfig(input: CreateSchedulingConfigInput) {
	const { data } = await http.post<SchedulingConfig>("/scheduling-configs", input);
	return data;
}

export async function updateSchedulingConfig(id: string, input: UpdateSchedulingConfigInput) {
	const { data } = await http.patch<SchedulingConfig>(`/scheduling-configs/${id}`, input);
	return data;
}

export async function deleteSchedulingConfig(id: string) {
	await http.delete(`/scheduling-configs/${id}`);
}
