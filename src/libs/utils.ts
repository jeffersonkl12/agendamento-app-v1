import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * Text styles próprios do projeto (definidos com @utility em src/assets/index.css).
 * Precisam do próprio classGroup no tailwind-merge, em conflito com font-size/font-weight/leading —
 * sem isso o twMerge ora classifica como utilitário de COR (apagando a tipografia
 * silenciosamente em `cn('text-paragraph', 'text-muted-foreground')`), ora deixa um
 * `font-medium`/`font-bold` de um componente do kit sobreviver ao lado do text-style
 * e vencer no CSS gerado (mesma especificidade, ordem de propriedade do Tailwind v4 decide).
 */
const TEXT_STYLES = [
  "title",
  "heading",
  "heading-caps",
  "label",
  "paragraph",
  "paragraph-light",
  "caption",
  "caption-sm",
  "button",
  "button-sm",
  "display",
  "metric",
  "metric-sm",
  "subheading",
  "heading-sm",
  "item-title",
  "tag",
  "label-strong",
  "overline",
  "overline-sm",
  "heading-lg",
  "tag-lg",
  "label-lg",
  "caption-md",
  "caption-lg",
  "caption-xs",
  "label-strong-lg",
  "paragraph-strong",
  "button-strong",
  "metric-xs",
  "overline-lg",
  "overline-md",
  "display-sm",
  "mark",
  "tag-sm",
]

const twMerge = extendTailwindMerge<'text-style'>({
  extend: {
    classGroups: {
      "text-style": [{ text: TEXT_STYLES }],
    },
    conflictingClassGroups: {
      "text-style": ["font-size", "font-weight", "leading"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
