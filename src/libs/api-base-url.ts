// Better Auth usa cookie SameSite=Lax: só viaja se a página e a API forem o mesmo host. Em dev,
// acessar o painel por um IP de LAN (ex.: pra testar no celular) enquanto VITE_API_URL aponta pra
// "localhost" faz o cookie de sessão ficar amarrado ao host "localhost" — os dois clients (axios
// e better-auth) precisam reescrever pro MESMO host, senão o cookie do login não bate com o host
// usado nas chamadas de domínio (ou vice-versa) e toda rota autenticada volta 401. A porta continua
// vindo do .env. Nunca roda fora de dev: em produção, VITE_API_URL é o domínio real da API.
export function resolveApiBaseUrl(configured: string): string {
	if (!import.meta.env.DEV) return configured;

	const apiUrl = new URL(configured);
	if (window.location.hostname !== apiUrl.hostname) {
		apiUrl.hostname = window.location.hostname;
	}
	return apiUrl.toString().replace(/\/$/, "");
}
