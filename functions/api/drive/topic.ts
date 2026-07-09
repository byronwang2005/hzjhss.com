import type { DriveEnv } from "../../../src/drive/config";
import { getDriveConfig } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readDriveSession, readJsonBody } from "../../../src/drive/http";
import { createTopic, readTopic, updateTopic } from "../../../src/drive/topic";

export const onRequestGet: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) {
      return session;
    }

    const url = new URL(request.url);
    const detail = await readTopic(getDriveConfig(env), url.searchParams.get("prefix"));
    return jsonResponse(detail);
  } catch (error) {
    return errorResponse(error);
  }
};

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) {
      return session;
    }

    const body = await readJsonBody(request);
    const detail = await createTopic(getDriveConfig(env), {
      name: body.name,
      description: body.description,
      displayName: session.displayName,
      origin: new URL(request.url).origin,
    });
    return jsonResponse(detail);
  } catch (error) {
    return errorResponse(error);
  }
};

export const onRequestPut: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) {
      return session;
    }

    const body = await readJsonBody(request);
    const detail = await updateTopic(getDriveConfig(env), {
      prefix: body.prefix,
      description: body.description,
      readPrompt: body.readPrompt,
      generatePrompt: body.generatePrompt,
      displayName: session.displayName,
    });
    return jsonResponse(detail);
  } catch (error) {
    return errorResponse(error);
  }
};
