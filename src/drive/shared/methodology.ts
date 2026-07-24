import type { KnowledgeRole } from "./contracts";

export const LEGACY_METHODOLOGY_PATH = "__methodology__.md";
export const METHODOLOGY_FILE_PREFIX = "嘉合杉升";
export const METHODOLOGY_FILE_SUFFIX = "方法论.md";

export function isReservedMethodologyPath(relativePath: string | undefined, methodologyPath = LEGACY_METHODOLOGY_PATH): boolean {
  return relativePath === LEGACY_METHODOLOGY_PATH || relativePath === methodologyPath;
}

export function knowledgeRoleForPath(
  value: unknown,
  relativePath?: string,
  methodologyPath = LEGACY_METHODOLOGY_PATH,
): KnowledgeRole {
  if (isReservedMethodologyPath(relativePath, methodologyPath)) return "methodology";
  return value === "reference" || value === "methodology" ? value : "evidence";
}
