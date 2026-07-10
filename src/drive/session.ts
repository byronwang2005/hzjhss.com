import type { DriveEnv } from "./config";
import { getRequiredEnv } from "./config";

const COOKIE_NAME = "jhss_drive_session";
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const MAX_DISPLAY_NAME_LENGTH = 40;
const DEFAULT_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
export const AGENT_OUTPUT_TOKEN_MAX_AGE_SECONDS = 60 * 60;

export interface DriveSession {
  v: 1;
  purpose: "drive-session";
  iat: number;
  exp: number;
  displayName: string;
}

export interface AgentOutputCapability {
  v: 1;
  purpose: "agent-output";
  iat: number;
  exp: number;
  displayName: string;
  topicPrefix: string;
  topicInstanceId: string;
  allowedPaths: string[];
}

export async function createSessionCookie(env: DriveEnv, requestUrl: string, displayName: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const maxAge = getSessionMaxAgeSeconds(env);
  const payload: DriveSession = {
    v: 1,
    purpose: "drive-session",
    iat: now,
    exp: now + maxAge,
    displayName: normalizeDisplayName(displayName),
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await signWithPurpose("drive-session", encodedPayload, getRequiredEnv(env, "DRIVE_SESSION_SECRET"));
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodedPayload}.${signature}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}

function getSessionMaxAgeSeconds(env: DriveEnv): number {
  const parsed = Number.parseInt(env.DRIVE_SESSION_MAX_AGE_SECONDS || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SESSION_MAX_AGE_SECONDS;
}

export function clearSessionCookie(requestUrl: string): string {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
}

export async function verifySessionCookie(env: DriveEnv, cookieHeader: string | null): Promise<boolean> {
  return (await getDriveSession(env, cookieHeader)) !== null;
}

export async function getDriveSession(env: DriveEnv, cookieHeader: string | null): Promise<DriveSession | null> {
  const value = parseCookie(cookieHeader, COOKIE_NAME);
  if (!value) {
    return null;
  }
  const [encodedPayload, providedSignature] = value.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = await signWithPurpose("drive-session", encodedPayload, getRequiredEnv(env, "DRIVE_SESSION_SECRET"));
  if (!constantTimeEqual(providedSignature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as DriveSession;
    if (payload.v !== 1 || payload.purpose !== "drive-session" || !Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (typeof payload.displayName !== "string" || !payload.displayName.trim()) {
      return null;
    }
    return {
      v: 1,
      purpose: "drive-session",
      iat: Number(payload.iat) || 0,
      exp: payload.exp,
      displayName: normalizeDisplayName(payload.displayName),
    };
  } catch {
    return null;
  }
}

export async function verifyAccessCode(env: DriveEnv, provided: unknown): Promise<boolean> {
  if (typeof provided !== "string") {
    return false;
  }
  const expected = getRequiredEnv(env, "DRIVE_ACCESS_CODE");
  const expectedDigest = await digest(expected);
  const providedDigest = await digest(provided.trim());
  return constantTimeEqual(expectedDigest, providedDigest);
}

export async function createAgentOutputToken(
  env: DriveEnv,
  input: { displayName: string; topicPrefix: string; topicInstanceId: string; allowedPaths: string[] },
): Promise<{ token: string; expiresAt: string; expiresIn: number }> {
  const now = Math.floor(Date.now() / 1000);
  const payload: AgentOutputCapability = {
    v: 1,
    purpose: "agent-output",
    iat: now,
    exp: now + AGENT_OUTPUT_TOKEN_MAX_AGE_SECONDS,
    displayName: normalizeDisplayName(input.displayName),
    topicPrefix: input.topicPrefix,
    topicInstanceId: input.topicInstanceId,
    allowedPaths: [...new Set(input.allowedPaths)],
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await signWithPurpose("agent-output", encodedPayload, getRequiredEnv(env, "DRIVE_SESSION_SECRET"));
  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    expiresIn: AGENT_OUTPUT_TOKEN_MAX_AGE_SECONDS,
  };
}

export async function getAgentOutputCapability(env: DriveEnv, authorization: string | null): Promise<AgentOutputCapability | null> {
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization || "");
  if (!match) {
    return null;
  }
  const [encodedPayload, providedSignature] = match[1].split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }
  const expectedSignature = await signWithPurpose("agent-output", encodedPayload, getRequiredEnv(env, "DRIVE_SESSION_SECRET"));
  if (!constantTimeEqual(providedSignature, expectedSignature)) {
    return null;
  }
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<AgentOutputCapability>;
    if (
      payload.v !== 1 ||
      payload.purpose !== "agent-output" ||
      !Number.isFinite(payload.exp) ||
      (payload.exp as number) <= Math.floor(Date.now() / 1000) ||
      typeof payload.displayName !== "string" ||
      typeof payload.topicPrefix !== "string" ||
      typeof payload.topicInstanceId !== "string" ||
      !Array.isArray(payload.allowedPaths) ||
      !payload.allowedPaths.every((path) => typeof path === "string")
    ) {
      return null;
    }
    return payload as AgentOutputCapability;
  } catch {
    return null;
  }
}

export function allowsAgentOutputPath(capability: AgentOutputCapability, path: string): boolean {
  return path.startsWith(capability.topicPrefix) && capability.allowedPaths.includes(path);
}

export function normalizeDisplayName(input: unknown): string {
  if (typeof input !== "string") {
    throw new Error("请输入登录姓名");
  }
  const displayName = input.trim().replace(/\s+/g, " ");
  if (!displayName) {
    throw new Error("请输入登录姓名");
  }
  if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    throw new Error("登录姓名过长");
  }
  if (CONTROL_CHARS.test(displayName)) {
    throw new Error("登录姓名包含非法字符");
  }
  return displayName;
}

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) {
    return null;
  }
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey === name) {
      return rawValue.join("=");
    }
  }
  return null;
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

async function signWithPurpose(purpose: "drive-session" | "agent-output", value: string, secret: string): Promise<string> {
  return sign(`${purpose}:${value}`, secret);
}

async function digest(value: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64UrlEncodeBytes(new Uint8Array(hash));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

function base64UrlEncode(value: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(value));
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
