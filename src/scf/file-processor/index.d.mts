export function extractRecords(event: unknown): Array<{ key: string }>;
export function structuredChunks(raw: unknown, extension: string): Array<{ content: string; locator: string }>;
export function splitMarkdown(markdown: string, extension: string): Array<{ content: string; locator: string }>;
export function parseMethodologyMarkdown(markdown: string, sourceName: string): {
  markdown: string;
  raw: { format: "markdown"; source: string };
  chunks: Array<{ content: string; locator: string }>;
};
export function extractReportDate(fileName: string, markdown: string, uploadedAt: string): {
  reportDate?: string;
  reportDateSource?: "filename" | "content" | "upload";
};
export function createTencentClientConfig(credential: { secretId: string; secretKey: string }, region: string): {
  credential: { secretId: string; secretKey: string };
  region: string;
  profile: { httpProfile: { reqTimeout: number } };
};
