import { XMLParser } from "fast-xml-parser";
import pLimit from "p-limit";
import pRetry from "p-retry";
import tencentcloud from "tencentcloud-sdk-nodejs";
import unzipper from "unzipper";
import { assertWebhook, bucket, cosCall, extension, fileMetaKey, getJson, head, parseSourceKey, processedBase, putJson, putText, region, required, ROOT_PREFIX, safeError, signedUrl, sourceKey } from "../lib/common.mjs";

const OcrClient = tencentcloud.ocr.v20181119.Client;
const ScfClient = tencentcloud.scf.v20180416.Client;
const credential = { secretId: required("TENCENT_SECRET_ID"), secretKey: required("TENCENT_SECRET_KEY") };
const ocr = new OcrClient(credential, region, { endpoint: "ocr.tencentcloudapi.com" });
const scf = new ScfClient(credential, region, { endpoint: "scf.tencentcloudapi.com" });
const xml = new XMLParser({ ignoreAttributes: false, trimValues: true });
const imageLimit = pLimit(10);
const documentLimit = pLimit(5);

export async function main(event) {
  assertWebhook(event);
  const records = extractRecords(event);
  const results = await Promise.allSettled(records.map((record) => processRecord(record)));
  return { ok: results.every((result) => result.status === "fulfilled"), processed: results.length };
}

async function processRecord(record) {
  const source = parseSourceKey(record.key);
  if (!source) return;
  const metadata = await pRetry(async () => {
    const value = await getJson(fileMetaKey(source.topicId, source.path));
    if (!value) throw new Error("文件元数据尚未登记");
    return value;
  }, { retries: 5, minTimeout: 1000, maxTimeout: 3000 });
  const previous = await getJson(`${processedBase(source.topicId, source.path)}status.json`);
  if (previous?.sourceEtag === metadata.etag && ["processing", "indexing", "ready"].includes(previous.state)) return;
  const current = await head(source.sourceKey);
  if (!current || current.etag !== metadata.etag) return;
  const base = processedBase(source.topicId, source.path);
  if (!(await writeStatus(base, metadata, "processing"))) return;
  try {
    const ext = extension(source.path);
    const output = ["png", "jpg", "jpeg", "bmp"].includes(ext)
      ? await imageLimit(() => processImage(source.sourceKey, metadata))
      : await documentLimit(() => processDocument(source.sourceKey, metadata, ext));
    const latest = await head(source.sourceKey);
    if (!latest || latest.etag !== metadata.etag) return;
    const chunks = output.chunks.map((chunk, index) => ({
      id: `${source.topicId}:${metadata.etag}:${index}`,
      topicId: source.topicId,
      path: source.path,
      fileName: metadata.name,
      content: chunk.content,
      locator: chunk.locator,
      etag: metadata.etag,
    }));
    await Promise.all([
      putText(`${base}result.md`, output.markdown),
      putJson(`${base}result.json`, output.raw),
      putJson(`${base}chunks.json`, { version: 1, topicId: source.topicId, path: source.path, sourceEtag: metadata.etag, chunks }),
      writeStatus(base, metadata, "indexing", output.requestId),
    ]);
    await invokeIndexer(source.topicId);
  } catch (error) {
    await writeStatus(base, metadata, "failed", undefined, safeError(error));
    throw error;
  }
}

async function processImage(key, metadata) {
  const response = await pRetry(() => cosCall("getObject", {
    Bucket: bucket,
    Region: region,
    Key: key,
    QueryString: "ci-process=OCR&type=efficient",
  }), { retries: 3, minTimeout: 600, maxTimeout: 5000 });
  const rawText = Buffer.from(response.Body).toString("utf8");
  const raw = xml.parse(rawText)?.Response || xml.parse(rawText);
  const detections = Array.isArray(raw.TextDetections) ? raw.TextDetections : raw.TextDetections ? [raw.TextDetections] : [];
  const content = detections.map((item) => String(item.DetectedText || "")).filter(Boolean).join("\n");
  if (!content.trim()) throw new Error("图片 OCR 未识别到文字");
  return { markdown: `# ${metadata.name}\n\n${content}\n`, raw, requestId: raw.RequestId, chunks: splitText(content, "图片 OCR") };
}

async function processDocument(key, metadata, ext) {
  if (ext === "pdf") await assertPdfPageLimit(key);
  const request = {
    FileUrl: signedUrl(key),
    FileType: fileType(ext),
    ResultType: 9,
    EnableSubImg: false,
    ...(ext === "pdf" ? { PageRange: `1-${metadata.pdfPages || 300}` } : {}),
  };
  const response = await pRetry(() => ocr.MultimodalDocParse(request), { retries: 2, minTimeout: 1000, maxTimeout: 8000 });
  if (!response.ResultUrl) throw new Error("腾讯云未返回文档解析结果地址");
  const download = await fetch(response.ResultUrl);
  if (!download.ok) throw new Error(`下载文档解析结果失败: ${download.status}`);
  const archive = await unzipper.Open.buffer(Buffer.from(await download.arrayBuffer()));
  const markdownEntry = archive.files.find((file) => file.path.toLowerCase().endsWith(".md"));
  const jsonEntry = archive.files.find((file) => file.path.toLowerCase().endsWith(".json"));
  if (!markdownEntry) throw new Error("文档解析结果缺少 Markdown");
  const markdown = (await markdownEntry.buffer()).toString("utf8");
  const raw = jsonEntry ? JSON.parse((await jsonEntry.buffer()).toString("utf8")) : { markdown };
  const structured = structuredChunks(raw, ext);
  return { markdown, raw, requestId: response.RequestId, chunks: structured.length ? structured : splitMarkdown(markdown, ext) };
}

async function assertPdfPageLimit(key) {
  const [{ getDocument }, response] = await Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    cosCall("getObject", { Bucket: bucket, Region: region, Key: key }),
  ]);
  const document = await getDocument({ data: new Uint8Array(response.Body), disableWorker: true }).promise;
  try {
    if (document.numPages > 300) throw new Error("PDF 最多支持 300 页");
  } finally {
    await document.destroy();
  }
}

export function structuredChunks(raw, ext) {
  const chunks = [];
  const seen = new Set();
  walk(raw, {});
  return chunks;

  function walk(value, context) {
    if (Array.isArray(value)) return value.forEach((item) => walk(item, context));
    if (!value || typeof value !== "object") return;
    const next = {
      page: value.PageNumber ?? value.PageNo ?? value.Page ?? context.page,
      slide: value.SlideNumber ?? value.SlideNo ?? context.slide,
      sheet: value.SheetName ?? value.WorkSheetName ?? context.sheet,
      heading: value.Title ?? value.Heading ?? context.heading,
    };
    const text = value.Markdown ?? value.Content ?? value.Text ?? value.DetectedText;
    if (typeof text === "string" && text.trim().length >= 20 && !seen.has(text)) {
      seen.add(text);
      chunks.push(...splitText(text, locator(next, ext)));
    }
    for (const child of Object.values(value)) walk(child, next);
  }
}

export function splitMarkdown(markdown, ext) {
  const sections = markdown.split(/(?=^#{1,6}\s+)/m).filter((item) => item.trim());
  return sections.flatMap((section, index) => {
    const heading = /^#{1,6}\s+(.+)$/m.exec(section)?.[1]?.trim();
    const detected = heading && /(?:第\s*)?(\d+)\s*(页|张|幻灯片)/.exec(heading);
    const location = detected
      ? detected[2] === "页" ? `第 ${detected[1]} 页` : `第 ${detected[1]} 张幻灯片`
      : ["xls", "xlsx"].includes(ext) && heading ? `工作表：${heading}` : heading ? `章节：${heading}` : `解析片段 ${index + 1}`;
    return splitText(section, location);
  });
}

function splitText(text, location) {
  const clean = text.replace(/\r\n/g, "\n").trim();
  const chunks = [];
  for (let start = 0, part = 1; start < clean.length; start += 1050, part += 1) {
    const content = clean.slice(start, start + 1200).trim();
    if (content) chunks.push({ content, locator: clean.length > 1200 ? `${location}，片段 ${part}` : location });
  }
  return chunks;
}

function locator(context, ext) {
  if (context.sheet) return `工作表：${context.sheet}`;
  if (context.slide) return `第 ${context.slide} 张幻灯片`;
  if (context.page) return `第 ${context.page} 页`;
  if (context.heading) return `章节：${context.heading}`;
  return ["xls", "xlsx"].includes(ext) ? "工作表" : "解析内容";
}

function fileType(ext) {
  if (ext === "pdf") return 1;
  if (["doc", "docx"].includes(ext)) return 2;
  if (["ppt", "pptx"].includes(ext)) return 3;
  if (["xls", "xlsx"].includes(ext)) return 4;
  if (ext === "md") return 5;
  if (ext === "txt") return 6;
  if (ext === "wps") return 8;
  throw new Error(`不支持的文档格式: ${ext}`);
}

async function writeStatus(base, metadata, state, requestId, error) {
  const current = await head(sourceKey(metadata.topicId, metadata.path));
  if (!current || current.etag !== metadata.etag) return false;
  await putJson(`${base}status.json`, { version: 1, topicId: metadata.topicId, path: metadata.path, sourceEtag: metadata.etag, state, processingKind: metadata.processingKind, updatedAt: new Date().toISOString(), ...(requestId ? { requestId } : {}), ...(error ? { error } : {}) });
  return true;
}

async function invokeIndexer(topicId) {
  await scf.Invoke({ FunctionName: required("INDEXER_FUNCTION_NAME"), InvocationType: "Event", ClientContext: JSON.stringify({ topicId }) });
}

export function extractRecords(event) {
  if (typeof event?.body === "string") {
    try { return extractRecords(JSON.parse(event.body)); } catch { return []; }
  }
  if (event?.topicId && event?.path) return [{ key: sourceKey(event.topicId, event.path) }];
  const records = event?.Records || event?.records || [];
  return records
    .map((record) => ({ key: normalizeEventKey(record.cos?.cosObject?.key || record.cosObject?.key || record.key || "") }))
    .filter((record) => Boolean(parseSourceKey(record.key)));
}

function normalizeEventKey(value) {
  let key;
  try { key = decodeURIComponent(String(value).replace(/\+/g, " ")); } catch { return ""; }
  return key.replace(/^\/\d+\/[^/]+\//, "").replace(/^\//, "");
}

export const handler = main;
