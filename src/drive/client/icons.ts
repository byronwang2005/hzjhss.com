import { html, type TemplateResult } from "lit";

export type IconWeight = "regular" | "bold" | "fill" | "duotone";

const iconSpriteUrl = `${new URL(/* @vite-ignore */ "../phosphor-sprite.svg", import.meta.url).href}?v=drive-icons-20260716-2`;

export function renderIcon(iconName: string, weight: IconWeight = "regular", className = ""): TemplateResult {
  const normalizedName = iconName.replace(/^ph-/, "").replace(/-fill$/, "");
  const resolvedWeight = iconName.endsWith("-fill") ? "fill" : weight;
  return html`<svg class=${`ui-icon ${className}`.trim()} aria-hidden="true" focusable="false"><use href=${`${iconSpriteUrl}#ph-${resolvedWeight}-${normalizedName}`}></use></svg>`;
}
