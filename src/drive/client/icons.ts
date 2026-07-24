import { html, type TemplateResult } from "lit";

export type IconWeight = "regular" | "bold" | "fill" | "duotone";

const iconSpriteUrl = "/assets/phosphor-sprite.svg";

export function renderIcon(iconName: string, weight: IconWeight = "regular", className = ""): TemplateResult {
  const normalizedName = iconName.replace(/^ph-/, "").replace(/-fill$/, "");
  const resolvedWeight = iconName.endsWith("-fill") ? "fill" : weight;
  return html`<svg class=${`ui-icon ${className}`.trim()} aria-hidden="true" focusable="false"><use href=${`${iconSpriteUrl}#ph-${resolvedWeight}-${normalizedName}`}></use></svg>`;
}
