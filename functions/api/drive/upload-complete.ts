import type { DriveEnv } from "../../../src/drive/config";
import { getDriveConfig } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readDriveSession, readJsonBody } from "../../../src/drive/http";
import { assertAllowedMaterialPath, assertExistingTopicMaterialPath, recordUploadComplete, recordUploadsComplete } from "../../../src/drive/topic";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) {
      return session;
    }

    const body = await readJsonBody(request);
    const config = getDriveConfig(env);
    if (Array.isArray(body.files)) {
      const firstPathByTopic = new Map<string, string>();
      for (const entry of body.files) {
        const path = assertAllowedMaterialPath((entry as { path?: unknown })?.path);
        firstPathByTopic.set(path.split("/", 1)[0], path);
      }
      for (const path of firstPathByTopic.values()) {
        await assertExistingTopicMaterialPath(config, path);
      }
      const files = await recordUploadsComplete(config, {
        files: body.files,
        displayName: session.displayName,
      });
      return jsonResponse({ ok: true, files });
    }
    await assertExistingTopicMaterialPath(config, body.path);
    const file = await recordUploadComplete(config, {
      path: body.path,
      size: body.size,
      contentType: body.contentType,
      kind: body.kind,
      displayName: session.displayName,
    });
    return jsonResponse({ ok: true, file });
  } catch (error) {
    return errorResponse(error);
  }
};
