export interface DriveEnv {
  COS_SECRET_ID?: string;
  COS_SECRET_KEY?: string;
  COS_BUCKET?: string;
  COS_REGION?: string;
  COS_ENDPOINT?: string;
  DRIVE_ACCESS_CODE?: string;
  DRIVE_SESSION_SECRET?: string;
  DRIVE_ROOT_PREFIX?: string;
  /** @deprecated Short-lived COS URLs are fixed at 30 minutes. */
  DRIVE_SIGN_EXPIRES_SECONDS?: string;
  DRIVE_SESSION_MAX_AGE_SECONDS?: string;
  PROCESSOR_WEBHOOK_URL?: string;
  PROCESSOR_WEBHOOK_SECRET?: string;
  INDEXER_WEBHOOK_URL?: string;
  INDEXER_WEBHOOK_SECRET?: string;
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
  AI_MODEL?: string;
  AI_MAX_OUTPUT_TOKENS?: string;
  AI_CONTEXT_WINDOW_TOKENS?: string;
  AI_PROVIDER?: string;
  AI_REASONING_EFFORT?: string;
  AI_REQUEST_TIMEOUT_MS?: string;
}

export type AiProvider = "deepseek" | "openai-compatible";
export type AiReasoningEffort = "high" | "max";

export interface AiConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  maxOutputTokens: number;
  contextWindowTokens: number;
  provider: AiProvider;
  reasoningEffort: AiReasoningEffort;
  requestTimeoutMs: number;
}

export interface DriveConfig {
  cosSecretId: string;
  cosSecretKey: string;
  bucket: string;
  region: string;
  endpoint: string;
  rootPrefix: string;
  signExpiresSeconds: number;
  sessionMaxAgeSeconds: number;
}

export const KNOWLEDGE_ROOT_PREFIX = "ai-knowledge-base/";
const SIGN_EXPIRES_SECONDS = 30 * 60;
export const DEFAULT_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const DEFAULT_AI_MAX_OUTPUT_TOKENS = 2500;
const DEFAULT_AI_REASONING_EFFORT: AiReasoningEffort = "high";
const DEFAULT_AI_REQUEST_TIMEOUT_MS = 300_000;

export function getRequiredEnv(env: DriveEnv, key: keyof DriveEnv): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function normalizeRootPrefix(value = KNOWLEDGE_ROOT_PREFIX): string {
  const clean = value.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/").trim();
  if (!clean) {
    return "";
  }
  return clean.endsWith("/") ? clean : `${clean}/`;
}

export function getDriveConfig(env: DriveEnv): DriveConfig {
  const bucket = getRequiredEnv(env, "COS_BUCKET");
  const region = getRequiredEnv(env, "COS_REGION");
  const endpoint = env.COS_ENDPOINT
    ? normalizeEndpoint(env.COS_ENDPOINT)
    : `https://${bucket}.cos.${region}.myqcloud.com`;

  return {
    cosSecretId: getRequiredEnv(env, "COS_SECRET_ID"),
    cosSecretKey: getRequiredEnv(env, "COS_SECRET_KEY"),
    bucket,
    region,
    endpoint,
    rootPrefix: KNOWLEDGE_ROOT_PREFIX,
    signExpiresSeconds: SIGN_EXPIRES_SECONDS,
    sessionMaxAgeSeconds: parsePositiveInt(env.DRIVE_SESSION_MAX_AGE_SECONDS, DEFAULT_SESSION_MAX_AGE_SECONDS),
  };
}

export function getAiConfig(env: DriveEnv): AiConfig {
  const contextWindowTokens = parseRequiredPositiveInt(env.AI_CONTEXT_WINDOW_TOKENS, "AI_CONTEXT_WINDOW_TOKENS");
  const maxOutputTokens = parsePositiveInt(env.AI_MAX_OUTPUT_TOKENS, DEFAULT_AI_MAX_OUTPUT_TOKENS);
  const model = getRequiredEnv(env, "AI_MODEL");
  if (contextWindowTokens - maxOutputTokens - Math.ceil(contextWindowTokens * 0.05) <= 0) {
    throw new Error("AI_CONTEXT_WINDOW_TOKENS 必须在 AI_MAX_OUTPUT_TOKENS 之外保留至少 5% 输入安全余量");
  }
  return {
    apiKey: getRequiredEnv(env, "AI_API_KEY"),
    baseURL: normalizeAiBaseUrl(getRequiredEnv(env, "AI_BASE_URL")),
    model,
    maxOutputTokens,
    contextWindowTokens,
    provider: parseAiProvider(env.AI_PROVIDER, model),
    reasoningEffort: parseAiReasoningEffort(env.AI_REASONING_EFFORT),
    requestTimeoutMs: parseOptionalPositiveInt(env.AI_REQUEST_TIMEOUT_MS, DEFAULT_AI_REQUEST_TIMEOUT_MS, "AI_REQUEST_TIMEOUT_MS"),
  };
}

function normalizeAiBaseUrl(value: string): string {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) {
    throw new Error("AI_BASE_URL 必须使用 HTTP 或 HTTPS");
  }
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function normalizeEndpoint(value: string): string {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(withProtocol);
  url.pathname = "";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseRequiredPositiveInt(value: string | undefined, name: string): number {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} 必须配置为正整数`);
  }
  return parsed;
}

function parseAiProvider(value: string | undefined, model: string): AiProvider {
  if (!value) return model.startsWith("deepseek-") ? "deepseek" : "openai-compatible";
  if (value === "deepseek" || value === "openai-compatible") return value;
  throw new Error("AI_PROVIDER 只支持 deepseek 或 openai-compatible");
}

function parseAiReasoningEffort(value: string | undefined): AiReasoningEffort {
  if (!value) return DEFAULT_AI_REASONING_EFFORT;
  if (value === "high" || value === "max") return value;
  throw new Error("AI_REASONING_EFFORT 只支持 high 或 max");
}

function parseOptionalPositiveInt(value: string | undefined, fallback: number, name: string): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${name} 必须配置为正整数`);
  return parsed;
}
