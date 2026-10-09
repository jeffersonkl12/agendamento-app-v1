import { isValidPhone, onlyDigits } from "@libs/format";
import { useUserStore } from "@stores/user";
import { computed } from "vue";

const TRADE_NAME_MAX_LENGTH = 120;

export interface BusinessProfileSaveResult {
	success: boolean;
	message: string;
}

/** "Studio Bella" → "SB"; "Ana" → "AN". */
function deriveInitials(name: string): string {
	const words = name.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return "";
	if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
	return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

/**
 * Perfil do profissional (back-api.md §5.1): o "negócio" é o próprio usuário — `tradeName` é o nome
 * do negócio e `phone` o telefone. A foto (`image`) só é exibida: a API não a altera em PATCH /users/me.
 */
export function useBusinessProfile() {
	const store = useUserStore();

	const businessName = computed(() => store.profile?.tradeName ?? null);
	const phone = computed(() => store.profile?.phone ?? null);
	const photoUrl = computed(() => store.profile?.image ?? null);
	// Sem foto, o painel exibe as iniciais do nome do negócio (ou do nome da conta enquanto não há).
	const initials = computed(() => deriveInitials(businessName.value ?? store.profile?.name ?? ""));

	async function load() {
		await store.ensureMe();
	}

	async function save(
		input: { tradeName: string } | { phone: string },
		successMessage: string,
	): Promise<BusinessProfileSaveResult> {
		const result = await store.updateProfile(input);
		if (!result) return { success: false, message: store.error ?? "Não foi possível salvar." };
		return { success: true, message: successMessage };
	}

	async function saveBusinessName(name: string): Promise<BusinessProfileSaveResult> {
		const tradeName = name.trim();
		if (!tradeName) return { success: false, message: "Informe o nome do seu negócio." };
		if (tradeName.length > TRADE_NAME_MAX_LENGTH) {
			return { success: false, message: "O nome pode ter no máximo 120 caracteres." };
		}
		return save({ tradeName }, "Nome do negócio salvo.");
	}

	async function savePhone(value: string): Promise<BusinessProfileSaveResult> {
		const digits = onlyDigits(value);
		if (!isValidPhone(digits)) {
			return {
				success: false,
				message: "Informe o telefone com DDI e DDD, só números (ex.: 5511999998888).",
			};
		}
		return save({ phone: digits }, "Telefone salvo.");
	}

	return {
		businessName,
		phone,
		photoUrl,
		initials,
		isSaving: computed(() => store.isLoading),
		load,
		saveBusinessName,
		savePhone,
	};
}
