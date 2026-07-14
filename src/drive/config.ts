export interface DriveEnv {
  COS_SECRET_ID?: string;
  COS_SECRET_KEY?: string;
  COS_BUCKET?: string;
  COS_REGION?: string;
  COS_ENDPOINT?: string;
  DRIVE_ACCESS_CODE?: string;
  DRIVE_SESSION_SECRET?: string;
  DRIVE_ROOT_PREFIX?: string;
  DRIVE_MAX_FILE_MB?: string;
  /** @deprecated Short-lived COS URLs are fixed at 30 minutes. */
  DRIVE_SIGN_EXPIRES_SECONDS?: string;
  DRIVE_SESSION_MAX_AGE_SECONDS?: string;
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
  AI_MODEL?: string;
  AI_MAX_OUTPUT_TOKENS?: string;
}

export interface AiConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  maxOutputTokens: number;
}

export interface DriveConfig {
  cosSecretId: string;
  cosSecretKey: string;
  bucket: string;
  region: string;
  endpoint: string;
  rootPrefix: string;
  maxFileBytes: number;
  signExpiresSeconds: number;
  sessionMaxAgeSeconds: number;
}

const DEFAULT_ROOT_PREFIX = "cloud-drive/";
const DEFAULT_MAX_FILE_MB = 512;
const SIGN_EXPIRES_SECONDS = 30 * 60;
const DEFAULT_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const DEFAULT_AI_MAX_OUTPUT_TOKENS = 2500;

export function getRequiredEnv(env: DriveEnv, key: keyof DriveEnv): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function normalizeRootPrefix(value = DEFAULT_ROOT_PREFIX): string {
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
    rootPrefix: normalizeRootPrefix(env.DRIVE_ROOT_PREFIX),
    maxFileBytes: parsePositiveInt(env.DRIVE_MAX_FILE_MB, DEFAULT_MAX_FILE_MB) * 1024 * 1024,
    signExpiresSeconds: SIGN_EXPIRES_SECONDS,
    sessionMaxAgeSeconds: parsePositiveInt(env.DRIVE_SESSION_MAX_AGE_SECONDS, DEFAULT_SESSION_MAX_AGE_SECONDS),
  };
}

export function getAiConfig(env: DriveEnv): AiConfig {
  return {
    apiKey: getRequiredEnv(env, "AI_API_KEY"),
    baseURL: normalizeAiBaseUrl(getRequiredEnv(env, "AI_BASE_URL")),
    model: getRequiredEnv(env, "AI_MODEL"),
    maxOutputTokens: parsePositiveInt(env.AI_MAX_OUTPUT_TOKENS, DEFAULT_AI_MAX_OUTPUT_TOKENS),
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
