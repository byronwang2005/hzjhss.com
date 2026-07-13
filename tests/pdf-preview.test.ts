// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";
import { DrivePdfPreview } from "../src/drive/client/pdf-preview";

type MutablePreviewState = {
  loading: boolean;
  failed: boolean;
  currentPage: number;
  pageCount: number;
};

afterEach(() => {
  document.body.replaceChildren();
});

async function mountPreview(): Promise<DrivePdfPreview> {
  const preview = new DrivePdfPreview();
  document.body.appendChild(preview);
  await preview.updateComplete;
  return preview;
}

describe("drive PDF preview rendering", () => {
  it("rerenders when PDF loading and page state changes", async () => {
    const preview = await mountPreview();
    const state = preview as unknown as MutablePreviewState;

    state.loading = false;
    state.currentPage = 2;
    state.pageCount = 5;
    await preview.updateComplete;

    expect(preview.querySelector(".drive-pdf-skeleton")).toBeNull();
    expect(preview.querySelector(".drive-pdf-page-count")?.textContent).toContain("2 / 5");
  });

  it("keeps the viewer measurable while loading and hides it only after failure", async () => {
    const preview = await mountPreview();
    const viewer = preview.querySelector<HTMLElement>("[data-pdf-viewer]");
    const state = preview as unknown as MutablePreviewState;

    expect(viewer?.hidden).toBe(false);

    state.loading = false;
    state.failed = true;
    await preview.updateComplete;

    expect(preview.querySelector(".drive-pdf-error")).not.toBeNull();
    expect(viewer?.hidden).toBe(true);
  });
});
