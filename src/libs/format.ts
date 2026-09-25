// Formatação e conversão puras (sem estado, sem regra de negócio) compartilhadas por composables e views.
// Dinheiro da API é sempre inteiro em centavos; datas são YYYY-MM-DD; horários vêm como HH:MM:SS
// (dashboard-api-routes.md §1.1).

const MONTH_NAMES = [
	"janeiro",
	"fevereiro",
	"março",
	"abril",
	"maio",
	"junho",
	"julho",
	"agosto",
	"setembro",
	"outubro",
	"novembro",
	"dezembro",
];

const weekdayDayMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
	weekday: "long",
	day: "numeric",
	month: "long",
});

export function formatCurrency(cents: number, fractionDigits = 2): string {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
	}).format(cents / 100);
}

/** Converte o valor digitado em reais ("49,90", "49.9", 49.9) para centavos; vazio ou inválido vira 0. */
export function reaisToCents(value: string | number | null | undefined): number {
	if (value === null || value === undefined || value === "") return 0;
	const numeric = typeof value === "number" ? value : Number(value.replace(",", "."));
	if (!Number.isFinite(numeric) || numeric < 0) return 0;
	return Math.round(numeric * 100);
}

export function centsToReais(cents: number): number {
	return cents / 100;
}

/** "14:30:00" → "14:30". */
export function formatTime(time: string): string {
	return time.slice(0, 5);
}

/** "5511999999999" → "+55 (11) 99999-9999"; formatos desconhecidos voltam como vieram. */
export function formatPhone(phone: string): string {
	const digits = phone.replace(/\D/g, "");
	const match = digits.match(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/);
	if (!match) return phone;
	const [, country, area, prefix, suffix] = match;
	return `+${country} (${area}) ${prefix}-${suffix}`;
}

export function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

// `new Date('YYYY-MM-DD')` é interpretado como UTC e volta um dia em fusos negativos (BRT);
// montar a data pelos componentes garante o dia local correto.
export function parseLocalDate(isoDate: string): Date {
	const [year, month, day] = isoDate.split("-").map(Number);
	return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
}

/** "2026-09-23" → "Quarta-feira, 23 de setembro". */
export function formatWeekdayDayMonth(isoDate: string): string {
	return capitalize(weekdayDayMonthFormatter.format(parseLocalDate(isoDate)));
}

/** "2026-10-12" → "12 de outubro". */
export function formatDayMonth(isoDate: string): string {
	const date = parseLocalDate(isoDate);
	return `${date.getDate()} de ${MONTH_NAMES[date.getMonth()]}`;
}

/** "2026-09-23" → "23 de setembro de 2026". */
export function formatLongDate(isoDate: string): string {
	const date = parseLocalDate(isoDate);
	return `${formatDayMonth(isoDate)} de ${date.getFullYear()}`;
}

/** (2026, 8) → "Setembro 2026". */
export function formatMonthYear(year: number, monthIndex: number): string {
	return `${capitalize(MONTH_NAMES[monthIndex])} ${year}`;
}

/** Data de hoje (YYYY-MM-DD) no fuso informado — não no fuso do navegador. */
export function todayInTimezone(timeZone: string): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date());
}
