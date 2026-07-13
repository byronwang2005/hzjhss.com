import type { DriveEnv } from "../../../src/drive/config";
import { toTopicDetailApiResponse } from "../../../src/drive/api-responses";
import { getDriveConfig } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readDriveSession, readJsonBody } from "../../../src/drive/http";
import { createTopic, deleteTopic, readTopic, transferTopicOwner, updateFeaturedOutput, updateTopic } from "../../../src/drive/topic";

export const onRequestGet: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) {
      return session;
    }

    const url = new URL(request.url);
    const detail = await readTopic(getDriveConfig(env), url.searchParams.get("prefix"), {
      displayName: session.displayName,
      origin: url.origin,
    });
    return jsonResponse(toTopicDetailApiResponse(detail, session.displayName));
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
      analysisKeywords: body.analysisKeywords,
      description: body.description,
      displayName: session.displayName,
      origin: new URL(request.url).origin,
    });
    return jsonResponse(toTopicDetailApiResponse(detail, session.displayName));
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
    const detail = Object.prototype.hasOwnProperty.call(body, "owner")
      ? await transferTopicOwner(getDriveConfig(env), {
          prefix: body.prefix,
          owner: body.owner,
          confirmName: body.confirmName,
          displayName: session.displayName,
          origin: new URL(request.url).origin,
        })
      : Object.prototype.hasOwnProperty.call(body, "featuredOutputPath")
      ? await updateFeaturedOutput(getDriveConfig(env), {
          prefix: body.prefix,
          path: body.featuredOutputPath,
          displayName: session.displayName,
          origin: new URL(request.url).origin,
        })
      : await updateTopic(getDriveConfig(env), {
      prefix: body.prefix,
      analysisKeywords: body.analysisKeywords,
      description: body.description,
      displayName: session.displayName,
      origin: new URL(request.url).origin,
        });
    return jsonResponse(toTopicDetailApiResponse(detail, session.displayName));
  } catch (error) {
    return errorResponse(error);
  }
};

export const onRequestDelete: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) {
      return session;
    }

    const body = await readJsonBody(request);
    const result = await deleteTopic(getDriveConfig(env), {
      prefix: body.prefix,
      confirmName: body.confirmName,
      displayName: session.displayName,
      origin: new URL(request.url).origin,
    });
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
};
