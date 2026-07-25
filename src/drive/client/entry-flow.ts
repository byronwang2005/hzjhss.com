import type { EntryState } from "./state";

export type EntryEvent =
  | "session-valid"
  | "session-unauthorized"
  | "submit-login"
  | "login-succeeded"
  | "login-failed"
  | "workspace-ready";

const transitions: Record<EntryState, Partial<Record<EntryEvent, EntryState>>> = {
  "checking-session": {
    "session-valid": "ready",
    "session-unauthorized": "signed-out",
  },
  "signed-out": {
    "submit-login": "authenticating",
  },
  "authenticating": {
    "login-succeeded": "preparing-workspace",
    "login-failed": "auth-error",
  },
  "preparing-workspace": {
    "workspace-ready": "ready",
  },
  "auth-error": {
    "submit-login": "authenticating",
  },
  ready: {},
};

export function transitionEntryState(current: EntryState, event: EntryEvent): EntryState {
  const next = transitions[current][event];
  if (!next) throw new Error(`Invalid entry transition: ${current} -> ${event}`);
  return next;
}
