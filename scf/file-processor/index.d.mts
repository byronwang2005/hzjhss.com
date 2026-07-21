export function extractRecords(event: unknown): Array<{ key: string }>;
export function structuredChunks(raw: unknown, extension: string): Array<{ content: string; locator: string }>;
export function splitMarkdown(markdown: string, extension: string): Array<{ content: string; locator: string }>;
