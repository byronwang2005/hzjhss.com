import { getDriveConfig, type DriveEnv } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readDriveSession } from "../../../src/drive/http";
import { readDriveOverview } from "../../../src/drive/topic";

export const onRequestGet: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) {
      return session;
    }
    const overview = await readDriveOverview(getDriveConfig(env), {
      displayName: session.displayName,
      origin: new URL(request.url).origin,
    });
    return jsonResponse(overview);
  } catch (error) {
    return errorResponse(error);
  }
};
