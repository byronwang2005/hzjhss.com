import type { DriveEnv } from "../../../src/drive/config";
import { getDriveConfig } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readDriveSession, readJsonBody } from "../../../src/drive/http";
import { createAgentOutputToken } from "../../../src/drive/session";
import { createAgentOutputPath, createAgentOutputPrompt, readTopic } from "../../../src/drive/topic";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) {
      return session;
    }

    const body = await readJsonBody(request);
    const origin = new URL(request.url).origin;
    const detail = await readTopic(getDriveConfig(env), body.prefix, {
      displayName: session.displayName,
      origin,
    });
    if (!detail.topic.analysisKeywords.trim()) {
      throw new Error("请先在设置中填写分析口径");
    }
    const pdfPath = createAgentOutputPath(detail.topic);
    const capability = await createAgentOutputToken(env, {
      displayName: session.displayName,
      topicPrefix: detail.topic.prefix,
      topicInstanceId: detail.topic.instanceId,
      allowedPaths: [pdfPath],
    });

    return jsonResponse({
      prompt: createAgentOutputPrompt({
        topic: detail.topic,
        origin,
        token: capability.token,
        expiresAt: capability.expiresAt,
        expiresIn: capability.expiresIn,
        pdfPath,
      }),
      expiresAt: capability.expiresAt,
      expiresIn: capability.expiresIn,
      paths: [pdfPath],
    });
  } catch (error) {
    return errorResponse(error);
  }
};
