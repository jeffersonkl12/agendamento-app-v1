import { useBusinessProfileStore } from "@stores/business-profile";
import { computed } from "vue";

const BUSINESS_NAME_MAX_LENGTH = 255;

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
 * Perfil do negócio (dashboard-api-routes.md §4): 1:1 com o prestador. Salvar faz POST se o perfil
 * ainda não existe e PATCH se já existe — POST duplicado devolve 500 (§1.3, §12#2).
 */
export function useBusinessProfile() {
	const store = useBusinessProfileStore();

	const hasProfile = computed(() => store.profile !== null);
	const businessName = computed(() => store.profile?.businessName ?? null);
	const photoUrl = computed(() => store.profile?.photoUrl ?? null);
	// §4: sem foto, o painel exibe as iniciais derivadas de businessName.
	const initials = computed(() => deriveInitials(businessName.value ?? ""));

	async function load() {
		await store.ensureMyProfile();
	}

	async function saveBusinessName(name: string): Promise<BusinessProfileSaveResult> {
		const businessName = name.trim();
		if (!businessName) return { success: false, message: "Informe o nome do seu negócio." };
		if (businessName.length > BUSINESS_NAME_MAX_LENGTH) {
			return { success: false, message: "O nome pode ter no máximo 255 caracteres." };
		}

		const result = store.profile
			? await store.updateProfile({ businessName })
			: await store.createProfile({ businessName });

		if (!result) return { success: false, message: store.error ?? "Não foi possível salvar." };
		return { success: true, message: "Nome do negócio salvo." };
	}

	return {
		hasProfile,
		businessName,
		photoUrl,
		initials,
		isSaving: computed(() => store.isLoading),
		load,
		saveBusinessName,
	};
}
