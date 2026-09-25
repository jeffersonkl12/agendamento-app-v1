import { http } from "@services/http";

export interface SchedulingConfig {
	id: string;
	businessOwnerId: string;
	mondayEnabled: boolean;
	tuesdayEnabled: boolean;
	wednesdayEnabled: boolean;
	thursdayEnabled: boolean;
	fridayEnabled: boolean;
	saturdayEnabled: boolean;
	sundayEnabled: boolean;
	startTime: string;
	endTime: string;
	intervalMinutes: number;
	activeTemplateId: string | null;
	timezone: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateSchedulingConfigInput {
	mondayEnabled?: boolean;
	tuesdayEnabled?: boolean;
	wednesdayEnabled?: boolean;
	thursdayEnabled?: boolean;
	fridayEnabled?: boolean;
	saturdayEnabled?: boolean;
	sundayEnabled?: boolean;
	startTime: string;
	endTime: string;
	intervalMinutes?: number;
	activeTemplateId?: string | null;
	timezone?: string;
}

export type UpdateSchedulingConfigInput = Partial<CreateSchedulingConfigInput>;

export async function getMySchedulingConfig() {
	const { data } = await http.get<SchedulingConfig>("/scheduling-configs/me");
	return data;
}

export async function createSchedulingConfig(input: CreateSchedulingConfigInput) {
	const { data } = await http.post<SchedulingConfig>("/scheduling-configs", input);
	return data;
}

export async function updateMySchedulingConfig(input: UpdateSchedulingConfigInput) {
	const { data } = await http.patch<SchedulingConfig>("/scheduling-configs/me", input);
	return data;
}
