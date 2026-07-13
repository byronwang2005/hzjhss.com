import type { DriveConfig } from "./config";
import { getObjectText, putObjectText } from "./cos";
import { DRIVE_ADMIN_DISPLAY_NAME, normalizeDisplayName } from "./session";

export const DRIVE_USERS_FILENAME = "._drive-users.json";

export interface DriveUserRecord {
  firstLoginAt: string;
  lastLoginAt: string;
}

interface DriveUserRegistry {
  version: 1;
  users: Record<string, DriveUserRecord>;
}

export async function registerDriveUser(config: DriveConfig, rawDisplayName: unknown, now = new Date()): Promise<void> {
  const displayName = normalizeDisplayName(rawDisplayName);
  const registry = await readDriveUserRegistry(config);
  const timestamp = now.toISOString();
  const existing = registry.users[displayName];
  registry.users[displayName] = {
    firstLoginAt: existing?.firstLoginAt || timestamp,
    lastLoginAt: timestamp,
  };
  await writeDriveUserRegistry(config, registry);
}

export async function listDriveUserCandidates(config: DriveConfig): Promise<string[]> {
  const registry = await readDriveUserRegistry(config);
  return Array.from(new Set([DRIVE_ADMIN_DISPLAY_NAME, ...Object.keys(registry.users)])).sort((a, b) =>
    a.localeCompare(b, "zh-Hans-CN"),
  );
}

export async function removeDriveUserCandidate(
  config: DriveConfig,
  rawDisplayName: unknown,
  activeOwners: Set<string>,
): Promise<void> {
  const displayName = normalizeDisplayName(rawDisplayName);
  if (displayName === DRIVE_ADMIN_DISPLAY_NAME) {
    throw new Error("不能移除管理员候选");
  }
  if (activeOwners.has(displayName)) {
    throw new Error("该用户仍是专题负责人，不能移除");
  }
  const registry = await readDriveUserRegistry(config);
  if (!registry.users[displayName]) {
    throw new Error("负责人候选不存在");
  }
  delete registry.users[displayName];
  await writeDriveUserRegistry(config, registry);
}

async function readDriveUserRegistry(config: DriveConfig): Promise<DriveUserRegistry> {
  const text = await getObjectText(config, DRIVE_USERS_FILENAME);
  if (!text) {
    return { version: 1, users: {} };
  }
  try {
    const parsed = JSON.parse(text) as Partial<DriveUserRegistry>;
    if (parsed.version !== 1 || !parsed.users || typeof parsed.users !== "object") {
      return { version: 1, users: {} };
    }
    const users: Record<string, DriveUserRecord> = {};
    for (const [name, record] of Object.entries(parsed.users)) {
      if (
        record &&
        typeof record === "object" &&
        typeof record.firstLoginAt === "string" &&
        typeof record.lastLoginAt === "string"
      ) {
        users[normalizeDisplayName(name)] = { firstLoginAt: record.firstLoginAt, lastLoginAt: record.lastLoginAt };
      }
    }
    return { version: 1, users };
  } catch {
    return { version: 1, users: {} };
  }
}

async function writeDriveUserRegistry(config: DriveConfig, registry: DriveUserRegistry): Promise<void> {
  await putObjectText(config, DRIVE_USERS_FILENAME, JSON.stringify(registry, null, 2), "application/json; charset=utf-8");
}
