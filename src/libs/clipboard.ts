// `navigator.clipboard` só existe em contexto seguro (https, ou localhost) — acessar o painel por
// IP de LAN em dev (http) deixa `navigator.clipboard` undefined e a chamada falha em silêncio se
// não tiver fallback. `execCommand("copy")` é deprecado mas ainda funciona em qualquer contexto.
export async function copyToClipboard(text: string): Promise<boolean> {
	if (navigator.clipboard) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// Ex.: permissão negada — cai pro fallback abaixo em vez de propagar o erro.
		}
	}

	const textarea = document.createElement("textarea");
	textarea.value = text;
	textarea.style.position = "fixed";
	textarea.style.opacity = "0";
	document.body.appendChild(textarea);
	textarea.focus();
	textarea.select();

	let succeeded = false;
	try {
		succeeded = document.execCommand("copy");
	} catch {
		succeeded = false;
	}
	document.body.removeChild(textarea);
	return succeeded;
}
