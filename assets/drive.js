(() => {
  const apiBase = "/api/drive";
  const state = {
    prefix: "",
    files: [],
    folders: [],
    loading: false,
  };

  const loginPanel = document.querySelector("[data-drive-login]");
  const appPanel = document.querySelector("[data-drive-app]");
  const loginForm = document.querySelector("[data-login-form]");
  const folderForm = document.querySelector("[data-folder-form]");
  const fileInput = document.querySelector("[data-file-input]");
  const logoutButton = document.querySelector("[data-logout]");
  const breadcrumbs = document.querySelector("[data-breadcrumbs]");
  const list = document.querySelector("[data-drive-list]");
  const status = document.querySelector("[data-status]");
  const progressWrap = document.querySelector("[data-upload-progress]");
  const progressName = document.querySelector("[data-progress-name]");
  const progressPercent = document.querySelector("[data-progress-percent]");
  const progressBar = document.querySelector("[data-progress-bar]");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(loginForm);
    setStatus("正在校验访问码...");
    try {
      await api("/login", {
        method: "POST",
        body: { accessCode: form.get("accessCode") },
      });
      loginForm.reset();
      showApp();
      await loadList("");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  folderForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(folderForm);
    const name = String(form.get("folderName") || "").trim();
    if (!name) {
      setStatus("请输入文件夹名称。", true);
      return;
    }
    try {
      await api("/folder", {
        method: "POST",
        body: { prefix: state.prefix, name },
      });
      folderForm.reset();
      setStatus("文件夹已创建。");
      await loadList(state.prefix);
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      return;
    }
    try {
      if (state.files.some((item) => item.name === file.name) && !window.confirm("当前目录已有同名文件，是否覆盖？")) {
        return;
      }
      await uploadFile(file);
      setStatus("上传完成。");
      await loadList(state.prefix);
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      fileInput.value = "";
      hideProgress();
    }
  });

  logoutButton.addEventListener("click", async () => {
    await api("/logout", { method: "POST" }).catch(() => null);
    showLogin();
    setStatus("已退出云盘。");
  });

  list.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) {
      return;
    }
    const action = target.dataset.action;
    const path = target.dataset.path || "";
    if (action === "open-folder") {
      await loadList(path);
      return;
    }
    if (action === "download") {
      await downloadFile(path);
      return;
    }
    if (action === "delete-file") {
      await removeObject(path, "确定删除这个文件吗？");
      return;
    }
    if (action === "delete-folder") {
      await removeObject(path, "确定删除这个文件夹标记吗？目录内文件不会被递归删除。");
    }
  });

  breadcrumbs.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-prefix]");
    if (target) {
      await loadList(target.dataset.prefix || "");
    }
  });

  loadList("").catch((error) => {
    if (error.status === 401) {
      showLogin();
      setStatus("请输入访问码后继续。");
      return;
    }
    showLogin();
    setStatus(error.message, true);
  });

  async function loadList(prefix) {
    state.loading = true;
    showApp();
    renderSkeleton();
    const params = new URLSearchParams({ prefix });
    const data = await api(`/list?${params.toString()}`);
    state.prefix = data.prefix || "";
    state.files = Array.isArray(data.files) ? data.files : [];
    state.folders = Array.isArray(data.folders) ? data.folders : [];
    state.loading = false;
    renderBreadcrumbs();
    renderList();
    setStatus(state.files.length || state.folders.length ? "目录已更新。" : "当前目录为空。");
  }

  async function uploadFile(file) {
    const data = await api("/upload-url", {
      method: "POST",
      body: {
        prefix: state.prefix,
        filename: file.name,
        size: file.size,
        contentType: file.type || "application/octet-stream",
      },
    });
    await uploadWithProgress(data.url, file, data.contentType);
  }

  function uploadWithProgress(url, file, contentType) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("content-type", contentType);
      showProgress(file.name, 0);
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          showProgress(file.name, Math.round((event.loaded / event.total) * 100));
        }
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          showProgress(file.name, 100);
          resolve();
        } else {
          reject(new Error(`上传失败，COS 返回 ${xhr.status}`));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("上传失败，请检查 COS CORS 配置。")));
      xhr.send(file);
    });
  }

  async function downloadFile(path) {
    try {
      const data = await api("/download-url", {
        method: "POST",
        body: { path },
      });
      window.location.href = data.url;
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  async function removeObject(path, message) {
    if (!window.confirm(message)) {
      return;
    }
    try {
      await api("/object", {
        method: "DELETE",
        body: { path },
      });
      setStatus("删除完成。");
      await loadList(state.prefix);
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  async function api(path, options = {}) {
    const init = {
      method: options.method || "GET",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
    };
    if (options.body) {
      init.body = JSON.stringify(options.body);
    }
    const response = await fetch(`${apiBase}${path}`, init);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "请求失败");
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function showLogin() {
    loginPanel.hidden = false;
    appPanel.hidden = true;
  }

  function showApp() {
    loginPanel.hidden = true;
    appPanel.hidden = false;
  }

  function renderBreadcrumbs() {
    const segments = state.prefix.split("/").filter(Boolean);
    const parts = [`<button type="button" data-prefix="">根目录</button>`];
    let prefix = "";
    for (const segment of segments) {
      prefix += `${segment}/`;
      parts.push(`<button type="button" data-prefix="${escapeAttr(prefix)}">${escapeHtml(segment)}</button>`);
    }
    breadcrumbs.innerHTML = parts.join("<span>/</span>");
  }

  function renderSkeleton() {
    list.innerHTML = `
      <div class="drive-row drive-row-head">
        <span>名称</span><span>大小</span><span>更新</span><span>操作</span>
      </div>
      ${Array.from({ length: 4 }).map(() => '<div class="drive-row drive-skeleton"><span></span><span></span><span></span><span></span></div>').join("")}
    `;
  }

  function renderList() {
    const rows = [];
    rows.push('<div class="drive-row drive-row-head"><span>名称</span><span>大小</span><span>更新</span><span>操作</span></div>');
    for (const folder of state.folders) {
      rows.push(`
        <div class="drive-row">
          <button class="drive-name drive-folder-name" type="button" data-action="open-folder" data-path="${escapeAttr(folder.path)}">${escapeHtml(folder.name)}</button>
          <span>文件夹</span>
          <span>-</span>
          <span class="drive-row-actions">
            <button type="button" data-action="delete-folder" data-path="${escapeAttr(folder.path)}">删除标记</button>
          </span>
        </div>
      `);
    }
    for (const file of state.files) {
      rows.push(`
        <div class="drive-row">
          <span class="drive-name">${escapeHtml(file.name)}</span>
          <span>${formatBytes(file.size)}</span>
          <span>${formatDate(file.lastModified)}</span>
          <span class="drive-row-actions">
            <button type="button" data-action="download" data-path="${escapeAttr(file.path)}">下载</button>
            <button type="button" data-action="delete-file" data-path="${escapeAttr(file.path)}">删除</button>
          </span>
        </div>
      `);
    }
    if (!state.folders.length && !state.files.length) {
      rows.push('<div class="drive-empty">这个目录还没有文件。上传一个文件，或先新建文件夹。</div>');
    }
    list.innerHTML = rows.join("");
  }

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  }

  function showProgress(name, percent) {
    progressWrap.hidden = false;
    progressName.textContent = name;
    progressPercent.textContent = `${percent}%`;
    progressBar.value = percent;
  }

  function hideProgress() {
    progressWrap.hidden = true;
    progressBar.value = 0;
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return "0 B";
    }
    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
