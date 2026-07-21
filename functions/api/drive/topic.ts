import { getDriveConfig, type DriveEnv } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readDriveAdminSession, readJsonBody } from "../../../src/drive/http";
import { createKnowledgeTopic, deleteKnowledgeTopic, readKnowledgeTopic, updateKnowledgeTopic } from "../../../src/drive/knowledge";
import { notifyIndexer } from "../../../src/drive/webhooks";

export const onRequestGet: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveAdminSession({ request, env });
    if (session instanceof Response) return session;
    return jsonResponse({ topic: await readKnowledgeTopic(getDriveConfig(env), new URL(request.url).searchParams.get("topicId")) });
  } catch (error) { return errorResponse(error); }
};

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveAdminSession({ request, env });
    if (session instanceof Response) return session;
    const body = await readJsonBody(request);
    return jsonResponse({ topic: await createKnowledgeTopic(getDriveConfig(env), body.name) });
  } catch (error) { return errorResponse(error); }
};

export const onRequestPut: PagesFunction<DriveEnv> = async ({ request, env, waitUntil }) => {
  try {
    const session = await readDriveAdminSession({ request, env });
    if (session instanceof Response) return session;
    const body = await readJsonBody(request);
    const topic = await updateKnowledgeTopic(getDriveConfig(env), body.topicId, body.name);
    waitUntil(notifyIndexer(env, { topicId: topic.id }));
    return jsonResponse({ topic });
  } catch (error) { return errorResponse(error); }
};

export const onRequestDelete: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveAdminSession({ request, env });
    if (session instanceof Response) return session;
    const body = await readJsonBody(request);
    return jsonResponse(await deleteKnowledgeTopic(getDriveConfig(env), body.topicId, body.confirmName));
  } catch (error) { return errorResponse(error); }
};
