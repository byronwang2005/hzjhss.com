import type { DriveEnv } from "../../../src/drive/config";
import { getDriveConfig } from "../../../src/drive/config";
import { headObject } from "../../../src/drive/cos";
import { errorResponse, jsonResponse, readJsonBody } from "../../../src/drive/http";
import { normalizeObjectPath } from "../../../src/drive/paths";
import { allowsAgentOutputPath, getAgentOutputCapability } from "../../../src/drive/session";
import { isExpectedAgentOutput, readExistingTopicMetadata, recordUploadComplete, setCurrentContextOutput } from "../../../src/drive/topic";

export const onRequestPost: PagesFunction<DriveEnv> = async ({ request, env }) => {
  try {
    const body = await readJsonBody(request);
    const path = normalizeObjectPath(body.path);
    const capability = await getAgentOutputCapability(env, request.headers.get("authorization"));
    if (!capability || !allowsAgentOutputPath(capability, path)) {
      return jsonResponse({ error: "回传授权无效、已过期或无权登记该路径" }, 401);
    }
    const config = getDriveConfig(env);
    const topic = await readExistingTopicMetadata(config, capability.topicPrefix);
    if (!topic || topic.instanceId !== capability.topicInstanceId || topic.owner !== capability.displayName) {
      return jsonResponse({ error: "专题已删除或回传授权已失效" }, 401);
    }
    const contentType = typeof body.contentType === "string" ? body.contentType : "";
    if (!isExpectedAgentOutput(path, contentType, topic)) {
      return jsonResponse({ error: "成果文件命名、格式或 contentType 不匹配" }, 400);
    }
    const size = typeof body.size === "number" ? body.size : Number(body.size ?? 0);
    if (!Number.isFinite(size) || size <= 0 || size > config.maxFileBytes) {
      return jsonResponse({ error: "文件大小无效" }, 400);
    }

    const object = await headObject(config, path);
    if (!object) {
      return jsonResponse({ error: "COS 中未找到已上传的成果文件" }, 400);
    }
    if (object.size !== size) {
      return jsonResponse({ error: "COS 文件实际大小与回传信息不一致" }, 400);
    }
    if (normalizeContentType(object.contentType) !== normalizeContentType(contentType)) {
      return jsonResponse({ error: "COS 文件实际 contentType 与回传信息不一致" }, 400);
    }

    const file = await recordUploadComplete(config, {
      path,
      size,
      contentType,
      kind: "output",
      displayName: capability.displayName,
    });
    const latestTopic = await readExistingTopicMetadata(config, capability.topicPrefix);
    if (!latestTopic || latestTopic.instanceId !== capability.topicInstanceId || latestTopic.owner !== capability.displayName) {
      return jsonResponse({ error: "专题负责人已变更，Context 已上传但未设为当前版本" }, 409);
    }
    await setCurrentContextOutput(config, latestTopic, path, capability.displayName);
    return jsonResponse({ ok: true, file });
  } catch (error) {
    return errorResponse(error);
  }
};

function normalizeContentType(value: string): string {
  return value.split(";", 1)[0].trim().toLowerCase();
}
