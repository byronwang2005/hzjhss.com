const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const MAX_SEGMENT_LENGTH = 180;
const MAX_RELATIVE_PATH_LENGTH = 900;

export class PathValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathValidationError";
  }
}

export function normalizePrefix(input: unknown): string {
  if (input == null || input === "") {
    return "";
  }
  const relative = normalizeRelativePath(String(input), { allowTrailingSlash: true, allowEmpty: true });
  return relative && !relative.endsWith("/") ? `${relative}/` : relative;
}

export function normalizeFileName(input: unknown): string {
  if (typeof input !== "string") {
    throw new PathValidationError("文件名不能为空");
  }
  const name = input.trim();
  validateSegment(name);
  if (name.includes("/") || name.includes("\\")) {
    throw new PathValidationError("文件名不能包含路径分隔符");
  }
  return name;
}

export function normalizeFolderName(input: unknown): string {
  return normalizeFileName(input);
}

export function normalizeObjectPath(input: unknown, options: { allowTrailingSlash?: boolean } = {}): string {
  if (typeof input !== "string") {
    throw new PathValidationError("文件路径不能为空");
  }
  return normalizeRelativePath(input, { allowTrailingSlash: Boolean(options.allowTrailingSlash), allowEmpty: false });
}

export function makeObjectKey(rootPrefix: string, relativePath: string): string {
  return `${rootPrefix}${relativePath}`;
}

export function trimRootPrefix(rootPrefix: string, key: string): string {
  return rootPrefix && key.startsWith(rootPrefix) ? key.slice(rootPrefix.length) : key;
}

function normalizeRelativePath(
  input: string,
  options: { allowTrailingSlash: boolean; allowEmpty: boolean },
): string {
  const raw = input.trim().replace(/\\/g, "/");
  if (CONTROL_CHARS.test(raw)) {
    throw new PathValidationError("路径包含非法控制字符");
  }
  if (raw.startsWith("/")) {
    throw new PathValidationError("路径不能以 / 开头");
  }
  if (raw.length > MAX_RELATIVE_PATH_LENGTH) {
    throw new PathValidationError("路径过长");
  }

  const wantsTrailingSlash = raw.endsWith("/");
  const segments = raw.split("/").filter(Boolean);
  if (!segments.length) {
    if (options.allowEmpty) {
      return "";
    }
    throw new PathValidationError("文件路径不能为空");
  }

  for (const segment of segments) {
    validateSegment(segment);
  }

  const normalized = segments.join("/");
  if (wantsTrailingSlash) {
    if (!options.allowTrailingSlash) {
      throw new PathValidationError("文件路径不能以 / 结尾");
    }
    return `${normalized}/`;
  }
  return normalized;
}

function validateSegment(segment: string): void {
  if (!segment || segment === "." || segment === "..") {
    throw new PathValidationError("路径不能包含 . 或 ..");
  }
  if (segment.length > MAX_SEGMENT_LENGTH) {
    throw new PathValidationError("路径片段过长");
  }
  if (CONTROL_CHARS.test(segment)) {
    throw new PathValidationError("路径包含非法控制字符");
  }
}
