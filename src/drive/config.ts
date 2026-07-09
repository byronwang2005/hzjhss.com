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
  DRIVE_SIGN_EXPIRES_SECONDS?: string;
  DRIVE_SESSION_MAX_AGE_SECONDS?: string;
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
const DEFAULT_SIGN_EXPIRES_SECONDS = 900;
const MAX_SIGN_EXPIRES_SECONDS = 3600;
const DEFAULT_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

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
    signExpiresSeconds: Math.min(
      parsePositiveInt(env.DRIVE_SIGN_EXPIRES_SECONDS, DEFAULT_SIGN_EXPIRES_SECONDS),
      MAX_SIGN_EXPIRES_SECONDS,
    ),
    sessionMaxAgeSeconds: parsePositiveInt(env.DRIVE_SESSION_MAX_AGE_SECONDS, DEFAULT_SESSION_MAX_AGE_SECONDS),
  };
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
