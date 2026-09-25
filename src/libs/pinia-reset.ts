import type { PiniaPluginContext } from "pinia";

// Setup stores não têm `$reset` nativo (só options stores). Este plugin tira um snapshot do estado
// inicial e reimplementa o `$reset` — usado no logout pra não vazar dados de um prestador pro próximo
// login na mesma aba. A store de auth fica de fora: o estado dela vem do client do better-auth.
export function setupStoreReset({ store }: PiniaPluginContext) {
	if (store.$id === "auth") return;

	const initialState = JSON.stringify(store.$state);
	store.$reset = () => {
		store.$patch((state) => {
			Object.assign(state, JSON.parse(initialState));
		});
	};
}
