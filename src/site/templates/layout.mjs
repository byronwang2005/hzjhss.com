import path from "node:path";

function sharedHeader(prefix, home) {
  const href = home ? "/docs/" : "../index.html";
  const ariaLabel = home ? "嘉合杉升 AI 手册首页" : "返回AI手册";
  return `<header class="site-header blog-header" aria-label="手册导航">
        <a class="brand-lockup docs-brand" href="${href}" aria-label="${ariaLabel}">
          <img class="company-logo" src="${prefix}/assets/jhss-logo-cropped.png" width="400" height="501" alt="${home ? "" : "嘉合杉升 Logo"}">
          <span><strong>嘉合杉升</strong><small>AI 手册</small></span>
        </a>
        <nav class="top-nav" aria-label="站点导航">
          <a href="/">AI 知识库</a>
          <a href="http://124.222.133.97/">AI 接入系统</a>
        </nav>
      </header>`;
}

function articleFooter() {
  return `<footer class="footer">
        <a href="../index.html">回到AI手册</a>
      </footer>`;
}

function siteAssets(prefix) {
  return `<link rel="icon" type="image/png" href="${prefix}/assets/jhss-logo-cropped.png">
    <script src="/theme-controller.js"></script>
    <link rel="stylesheet" href="${prefix}/styles.css">`;
}

export function renderSitePage(source, relativePath) {
  const normalized = relativePath.split(path.sep).join("/");
  if (normalized === "index.html") return source;
  const depth = normalized.split("/").length - 1;
  const prefix = depth === 0 ? "." : Array.from({ length: depth }, () => "..").join("/");
  const home = normalized === "docs/index.html";

  return source
    .replace("{{site-assets}}", siteAssets(prefix))
    .replace("{{site-header}}", sharedHeader(prefix, home))
    .replace("{{article-footer}}", articleFooter());
}
