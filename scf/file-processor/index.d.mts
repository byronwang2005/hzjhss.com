export function extractRecords(event: unknown): Array<{ key: string }>;
export function structuredChunks(raw: unknown, extension: string): Array<{ content: string; locator: string }>;
export function splitMarkdown(markdown: string, extension: string): Array<{ content: string; locator: string }>;
export function createTencentClientConfig(credential: { secretId: string; secretKey: string }, region: string): {
  credential: { secretId: string; secretKey: string };
  region: string;
  profile: { httpProfile: { reqTimeout: number } };
};
