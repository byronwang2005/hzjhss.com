import type { DriveEnv } from "../../../src/drive/config";
import { getDriveConfig } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readDriveSession, readJsonBody } from "../../../src/drive/http";
import { createAgentManifest } from "../../../src/drive/topic";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) {
      return session;
    }

    const body = await readJsonBody(request);
    const result = await createAgentManifest(getDriveConfig(env), {
      prefix: body.prefix,
    });
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
};
