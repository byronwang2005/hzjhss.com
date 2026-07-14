import type { DriveEnv } from "../../../src/drive/config";
import { getDriveConfig } from "../../../src/drive/config";
import { errorResponse, jsonResponse, readDriveSession, readJsonBody } from "../../../src/drive/http";
import { createAgentOutputToken } from "../../../src/drive/session";
import {
  createAgentContextPrompt,
  createAgentManifest,
  createAgentOutputPath,
  readTopic,
} from "../../../src/drive/topic";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const session = await readDriveSession({ request, env });
    if (session instanceof Response) {
      return session;
    }

    const body = await readJsonBody(request);
    const origin = new URL(request.url).origin;
    const config = getDriveConfig(env);
    const detail = await readTopic(config, body.prefix, { displayName: session.displayName, origin });
    if (detail.topic.owner !== session.displayName) {
      const error = new Error("只有当前专题负责人可以生成 Context");
      error.name = "DriveForbiddenError";
      throw error;
    }
    if (!detail.topic.analysisKeywords.trim()) {
      throw new Error("请先在设置中填写分析口径");
    }

    const manifest = await createAgentManifest(config, {
      prefix: detail.topic.prefix,
      displayName: session.displayName,
      origin,
    });
    const outputPath = createAgentOutputPath(detail.topic);
    const capability = await createAgentOutputToken(env, {
      displayName: session.displayName,
      topicPrefix: detail.topic.prefix,
      topicInstanceId: detail.topic.instanceId,
      allowedPaths: [outputPath],
    });

    return jsonResponse({
      ...manifest,
      outputPath,
      token: capability.token,
      uploadExpiresAt: capability.expiresAt,
      uploadExpiresIn: capability.expiresIn,
      prompt: createAgentContextPrompt({
        topic: detail.topic,
        generatedAt: manifest.generatedAt,
        manifestExpiresAt: manifest.expiresAt,
        manifestExpiresIn: manifest.expiresIn,
        uploadExpiresAt: capability.expiresAt,
        uploadExpiresIn: capability.expiresIn,
        fileCount: manifest.fileCount,
        manifestUrl: manifest.manifestUrl,
        displayName: session.displayName,
        origin,
        token: capability.token,
        outputPath,
      }),
    });
  } catch (error) {
    return errorResponse(error);
  }
};
