(() => {
  const apiBase = "/api/drive";
  const promptFiles = new Set(["成果生成与回传.prompt.md"]);
  const previewExtensions = new Set(["html", "htm", "pdf", "md", "markdown", "txt"]);
  const state = {
    prefix: "",
    files: [],
    folders: [],
    topic: null,
    generatePrompt: "",
    outputs: [],
    displayName: "",
  };

  const loginPanel = document.querySelector("[data-drive-login]");
  const appPanel = document.querySelector("[data-drive-app]");
  const loginForm = document.querySelector("[data-login-form]");
  const topicForm = document.querySelector("[data-topic-form]");
  const fileInput = document.querySelector("[data-file-input]");
  const folderInput = document.querySelector("[data-folder-input]");
  const uploadWrap = document.querySelector("[data-upload-wrap]");
  const logoutButton = document.querySelector("[data-logout]");
  const breadcrumbs = document.querySelector("[data-breadcrumbs]");
  const list = document.querySelector("[data-drive-list]");
  const outputList = document.querySelector("[data-output-list]");
  const status = document.querySelector("[data-status]");
  const progressWrap = document.querySelector("[data-upload-progress]");
  const progressName = document.querySelector("[data-progress-name]");
  const progressPercent = document.querySelector("[data-progress-percent]");
  const progressBar = document.querySelector("[data-progress-bar]");
  const topicPanel = document.querySelector("[data-topic-panel]");
  const topicTitle = document.querySelector("[data-topic-title]");
  const topicMeta = document.querySelector("[data-topic-meta]");
  const topicDescription = document.querySelector("[data-topic-description]");
  const generatePrompt = document.querySelector("[data-generate-prompt]");
  const saveTopicButton = document.querySelector("[data-save-topic]");
  const deleteModal = document.querySelector("[data-delete-modal]");
  const deleteTitle = document.querySelector("[data-delete-title]");
  const deleteMessage = document.querySelector("[data-delete-message]");
  const deleteInputLabel = document.querySelector("[data-delete-input-label]");
  const deleteInput = document.querySelector("[data-delete-confirm-input]");
  const deleteCancel = document.querySelector("[data-delete-cancel]");
  const deleteConfirm = document.querySelector("[data-delete-confirm]");
  let pendingDelete = null;

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(loginForm);
    setStatus("正在校验身份...");
    try {
      const data = await api("/login", {
        method: "POST",
        body: {
          displayName: form.get("displayName"),
          accessCode: form.get("accessCode"),
        },
      });
      state.displayName = data.displayName || "";
      loginForm.reset();
      showApp();
      await loadList("");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  topicForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(topicForm);
    const name = String(form.get("topicName") || "").trim();
    if (!name) {
      setStatus("请输入专题名称。", true);
      return;
    }
    try {
      setStatus("正在创建专题...");
      const detail = await api("/topic", {
        method: "POST",
        body: {
          name,
          description: form.get("topicDescription"),
        },
      });
      topicForm.reset();
      setStatus("专题已创建，默认提示词已生成。");
      await loadList(detail.topic.prefix);
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  fileInput.addEventListener("change", async () => {
    const files = Array.from(fileInput.files || []);
    if (!files.length) {
      return;
    }
    try {
      if (!state.prefix || !state.topic) {
        setStatus("请先进入一个专题再上传资料。", true);
        return;
      }
      await uploadFiles(files, (file) => file.name);
      setStatus(`上传完成，已登记 ${files.length} 个文件的上传者。`);
      await loadList(state.prefix);
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      fileInput.value = "";
      hideProgress();
    }
  });

  folderInput.addEventListener("change", async () => {
    const files = Array.from(folderInput.files || []);
    if (!files.length) {
      return;
    }
    try {
      if (!state.prefix || !state.topic) {
        setStatus("请先进入一个专题再上传资料。", true);
        return;
      }
      await uploadFiles(files, (file) => file.webkitRelativePath || file.name);
      setStatus(`文件夹上传完成，已登记 ${files.length} 个文件的上传者。`);
      await loadList(state.prefix);
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      folderInput.value = "";
      hideProgress();
    }
  });

  logoutButton.addEventListener("click", async () => {
    await api("/logout", { method: "POST" }).catch(() => null);
    state.displayName = "";
    showLogin();
    setStatus("已退出资料库。");
  });

  list.addEventListener("click", handleListAction);
  outputList.addEventListener("click", handleListAction);

  breadcrumbs.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-prefix]");
    if (target) {
      await loadList(target.dataset.prefix || "");
    }
  });

  saveTopicButton.addEventListener("click", async () => {
    if (!state.topic) {
      return;
    }
    try {
      setStatus("正在保存专题设置...");
      const detail = await api("/topic", {
        method: "PUT",
        body: {
          prefix: state.topic.prefix,
          description: topicDescription.value,
          generatePrompt: generatePrompt.value,
        },
      });
      applyTopicDetail(detail);
      renderTopicPanel();
      setStatus("专题设置已保存。");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  topicPanel.addEventListener("click", async (event) => {
    const deleteTopicTarget = event.target.closest("[data-delete-topic]");
    if (deleteTopicTarget) {
      openTopicDeleteModal();
      return;
    }

    const agentTarget = event.target.closest("[data-agent-manifest]");
    if (agentTarget) {
      await copyAgentManifestPrompt(agentTarget);
      return;
    }

    const target = event.target.closest("[data-copy-prompt]");
    if (!target) {
      return;
    }
    const value = generatePrompt.value;
    const copied = await copyText(value);
    if (copied) {
      setStatus("生成与回传提示词已复制。");
    } else {
      setStatus("复制失败，请手动选中文本复制。", true);
    }
  });

  deleteInput.addEventListener("input", () => {
    deleteConfirm.disabled = !pendingDelete || deleteInput.value !== pendingDelete.name;
  });

  deleteCancel.addEventListener("click", closeDeleteModal);

  deleteConfirm.addEventListener("click", async () => {
    if (!pendingDelete || deleteInput.value !== pendingDelete.name) {
      return;
    }
    const target = pendingDelete;
    closeDeleteModal();
    if (target.type === "topic") {
      await removeTopic(target.prefix, target.name);
    } else {
      await removeObject(target.path);
    }
  });

  loadList("").catch((error) => {
    if (error.status === 401) {
      showLogin();
      setStatus("请输入姓名和访问码后继续。");
      return;
    }
    showLogin();
    setStatus(error.message, true);
  });

  async function handleListAction(event) {
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
    if (action === "preview") {
      await openFile(path);
      return;
    }
    if (action === "download") {
      await downloadFile(path);
      return;
    }
    if (action === "delete-file") {
      openDeleteModal(path, target.dataset.name || path.split("/").pop() || path);
    }
  }

  async function copyAgentManifestPrompt(button) {
    if (!state.topic) {
      return;
    }
    const originalText = button.textContent;
    try {
      button.disabled = true;
      button.textContent = "正在生成...";
      setStatus("正在生成 agent 分析提示词...");
      const data = await api("/agent-manifest", {
        method: "POST",
        body: { prefix: state.topic.prefix },
      });
      const copied = await copyText(data.prompt || "");
      if (copied) {
        button.textContent = "已复制";
        setStatus(`agent 分析提示词已复制。资料 ${data.fileCount || 0} 个，链接 ${data.expiresIn || 0} 秒内有效。`);
        window.setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 1600);
      } else {
        window.prompt("浏览器未允许自动复制，请手动复制 agent 分析提示词：", data.prompt || "");
        setStatus("浏览器未允许自动复制，请在弹窗中手动复制 agent 分析提示词。", true);
        button.textContent = originalText;
        button.disabled = false;
      }
    } catch (error) {
      setStatus(error.message, true);
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  async function loadList(prefix) {
    showApp();
    renderSkeleton(list);
    const params = new URLSearchParams({ prefix });
    const data = await api(`/list?${params.toString()}`);
    state.prefix = data.prefix || "";
    state.files = Array.isArray(data.files) ? data.files : [];
    state.folders = Array.isArray(data.folders) ? data.folders : [];
    state.topic = null;
    state.generatePrompt = "";
    state.outputs = [];

    if (isTopicRoot(state.prefix)) {
      try {
        const detail = await api(`/topic?${new URLSearchParams({ prefix: state.prefix }).toString()}`);
        applyTopicDetail(detail);
      } catch (error) {
        setStatus(`这个文件夹还不是标准专题：${error.message}`, true);
      }
    }

    renderControls();
    renderBreadcrumbs();
    renderTopicPanel();
    renderList();
    setStatus(statusText());
  }

  function applyTopicDetail(detail) {
    state.topic = detail.topic || null;
    state.generatePrompt = detail.generatePrompt || "";
    state.outputs = Array.isArray(detail.outputs) ? detail.outputs : [];
  }

  async function uploadFiles(files, relativePathForFile) {
    const entries = files.map((file) => ({
      file,
      relativePath: normalizeClientRelativePath(relativePathForFile(file)),
    }));
    const conflicts = await findUploadConflicts(entries);
    if (conflicts.length && !window.confirm(`将覆盖 ${conflicts.length} 个同路径同名文件。是否继续上传？`)) {
      return;
    }

    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      try {
        await uploadFile(entry.file, state.prefix, "material", entry.relativePath, `${index + 1}/${entries.length} ${entry.relativePath}`);
      } catch (error) {
        throw new Error(`上传失败：${entry.relativePath}。${error.message}`);
      }
    }
  }

  async function uploadFile(file, prefix, kind, relativePath, progressLabel) {
    const data = await api("/upload-url", {
      method: "POST",
      body: {
        prefix,
        filename: file.name,
        relativePath,
        size: file.size,
        contentType: file.type || "application/octet-stream",
      },
    });
    await uploadWithProgress(data.url, file, data.contentType, progressLabel || relativePath || file.name);
    await api("/upload-complete", {
      method: "POST",
      body: {
        path: data.path,
        size: file.size,
        contentType: data.contentType,
        kind,
      },
    });
  }

  function uploadWithProgress(url, file, contentType, label) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("content-type", contentType);
      showProgress(label, 0);
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          showProgress(label, Math.round((event.loaded / event.total) * 100));
        }
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          showProgress(label, 100);
          resolve();
        } else {
          reject(new Error(`上传失败，COS 返回 ${xhr.status}`));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("上传失败，请检查 COS CORS 配置。")));
      xhr.send(file);
    });
  }

  async function findUploadConflicts(entries) {
    const directoryPrefixes = Array.from(new Set(entries.map((entry) => directoryPrefix(entry.relativePath))));
    const existingByDirectory = new Map();
    await Promise.all(directoryPrefixes.map(async (directory) => {
      const prefix = `${state.prefix}${directory}`;
      try {
        const data = await api(`/list?${new URLSearchParams({ prefix }).toString()}`);
        const names = new Set((Array.isArray(data.files) ? data.files : []).map((file) => file.name));
        existingByDirectory.set(directory, names);
      } catch {
        existingByDirectory.set(directory, new Set());
      }
    }));

    return entries.filter((entry) => {
      const directory = directoryPrefix(entry.relativePath);
      const name = fileNameFromPath(entry.relativePath);
      return existingByDirectory.get(directory)?.has(name);
    });
  }

  async function openFile(path) {
    try {
      const data = await api("/download-url", {
        method: "POST",
        body: { path },
      });
      window.open(data.url, "_blank", "noopener");
    } catch (error) {
      setStatus(error.message, true);
    }
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

  async function removeObject(path) {
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

  async function removeTopic(prefix, confirmName) {
    try {
      setStatus("正在删除专题...");
      const result = await api("/topic", {
        method: "DELETE",
        body: { prefix, confirmName },
      });
      setStatus(`专题已删除，共删除 ${result.deletedCount || 0} 个对象。`);
      await loadList("");
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

  async function copyText(value) {
    if (!value) {
      return false;
    }
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }

  function renderControls() {
    topicForm.hidden = state.prefix !== "";
    uploadWrap.hidden = !state.topic;
  }

  function renderBreadcrumbs() {
    const segments = state.prefix.split("/").filter(Boolean);
    const parts = [`<button type="button" data-prefix="">专题库</button>`];
    let prefix = "";
    for (const segment of segments) {
      prefix += `${segment}/`;
      parts.push(`<button type="button" data-prefix="${escapeAttr(prefix)}">${escapeHtml(segment)}</button>`);
    }
    breadcrumbs.innerHTML = parts.join("<span>/</span>");
  }

  function renderTopicPanel() {
    if (!state.topic) {
      topicPanel.hidden = true;
      return;
    }
    topicPanel.hidden = false;
    topicTitle.textContent = state.topic.name;
    topicMeta.textContent = `创建人：${state.topic.createdBy || "-"} · 最近更新：${formatDateTime(state.topic.updatedAt)} · 路径：${state.topic.prefix}`;
    topicDescription.value = state.topic.description || "";
    generatePrompt.value = state.generatePrompt;
    renderFileRows(outputList, state.outputs, {
      empty: "outputs/ 目录还没有成果。请让本地 AI agent 按提示词生成并回传。",
      includePreview: true,
      title: "成果名称",
    });
  }

  function renderSkeleton(target) {
    target.innerHTML = `
      <div class="drive-row drive-row-head">
        <span>名称</span><span>类型</span><span>上传者</span><span>更新</span><span>操作</span>
      </div>
      ${Array.from({ length: 4 }).map(() => '<div class="drive-row drive-skeleton"><span></span><span></span><span></span><span></span><span></span></div>').join("")}
    `;
  }

  function renderList() {
    if (!state.prefix) {
      renderRootTopics();
      return;
    }
    const visibleFolders = state.folders.filter((folder) => folder.name !== "outputs");
    const visibleFiles = state.files.filter((file) => !promptFiles.has(file.name));
    const rows = [];
    rows.push('<div class="drive-row drive-row-head"><span>资料名称</span><span>类型</span><span>上传者</span><span>更新</span><span>操作</span></div>');
    for (const folder of visibleFolders) {
      rows.push(renderFolderRow(folder, "文件夹"));
    }
    rows.push(...visibleFiles.map((file) => renderFileRow(file, { includePreview: true })));
    if (!visibleFolders.length && !visibleFiles.length) {
      rows.push('<div class="drive-empty">这个专题还没有资料。上传研报、周报或整个资料文件夹开始沉淀。</div>');
    }
    list.innerHTML = rows.join("");
  }

  function renderRootTopics() {
    const rows = [];
    rows.push('<div class="drive-row drive-row-head"><span>专题名称</span><span>类型</span><span>上传者</span><span>更新</span><span>操作</span></div>');
    for (const folder of state.folders) {
      rows.push(renderFolderRow(folder, "专题"));
    }
    for (const file of state.files) {
      rows.push(renderFileRow(file, { includePreview: false }));
    }
    if (!state.folders.length && !state.files.length) {
      rows.push('<div class="drive-empty">还没有专题。创建一个专题后，会自动生成方法论提示词和成果目录。</div>');
    }
    list.innerHTML = rows.join("");
  }

  function renderFileRows(target, files, options) {
    const rows = [];
    rows.push(`<div class="drive-row drive-row-head"><span>${escapeHtml(options.title || "名称")}</span><span>类型</span><span>上传者</span><span>更新</span><span>操作</span></div>`);
    rows.push(...files.map((file) => renderFileRow(file, { includePreview: options.includePreview })));
    if (!files.length) {
      rows.push(`<div class="drive-empty">${escapeHtml(options.empty)}</div>`);
    }
    target.innerHTML = rows.join("");
  }

  function renderFolderRow(folder, label) {
    return `
      <div class="drive-row">
        <button class="drive-name drive-folder-name" type="button" data-action="open-folder" data-path="${escapeAttr(folder.path)}">${escapeHtml(folder.name)}</button>
        <span>${escapeHtml(label)}</span>
        <span>-</span>
        <span>-</span>
        <span class="drive-row-actions">
          <button type="button" data-action="open-folder" data-path="${escapeAttr(folder.path)}">打开</button>
        </span>
      </div>
    `;
  }

  function renderFileRow(file, options) {
    const preview = options.includePreview && isPreviewable(file.name)
      ? `<button type="button" data-action="preview" data-path="${escapeAttr(file.path)}">预览</button>`
      : "";
    return `
      <div class="drive-row">
        <span class="drive-name">${escapeHtml(file.name)}</span>
        <span>${escapeHtml(fileLabel(file))}</span>
        <span>${escapeHtml(file.uploadedBy || "-")}</span>
        <span>${formatDate(file.uploadedAt || file.lastModified)}</span>
        <span class="drive-row-actions">
          ${preview}
          <button type="button" data-action="download" data-path="${escapeAttr(file.path)}">下载</button>
          <button type="button" data-action="delete-file" data-path="${escapeAttr(file.path)}" data-name="${escapeAttr(file.name)}">删除</button>
        </span>
      </div>
    `;
  }

  function openDeleteModal(path, name) {
    pendingDelete = { type: "file", path, name };
    deleteTitle.textContent = "确认删除文件";
    deleteInputLabel.textContent = "请输入完整文件名以确认删除";
    deleteConfirm.textContent = "永久删除";
    deleteMessage.textContent = `将永久删除「${name}」。此操作不会删除其他文件，但无法从资料库恢复。`;
    deleteInput.value = "";
    deleteConfirm.disabled = true;
    deleteModal.hidden = false;
    window.setTimeout(() => deleteInput.focus(), 0);
  }

  function openTopicDeleteModal() {
    if (!state.topic) {
      return;
    }
    pendingDelete = { type: "topic", prefix: state.topic.prefix, name: state.topic.name };
    deleteTitle.textContent = "确认删除专题";
    deleteInputLabel.textContent = "请输入完整专题名以确认删除";
    deleteConfirm.textContent = "永久删除专题";
    deleteMessage.textContent = `将永久删除专题「${state.topic.name}」及其全部资料、提示词、成果和临时 manifest。此操作不可恢复。`;
    deleteInput.value = "";
    deleteConfirm.disabled = true;
    deleteModal.hidden = false;
    window.setTimeout(() => deleteInput.focus(), 0);
  }

  function closeDeleteModal() {
    pendingDelete = null;
    deleteModal.hidden = true;
    deleteInput.value = "";
    deleteConfirm.disabled = true;
    deleteConfirm.textContent = "永久删除";
  }

  function showLogin() {
    loginPanel.hidden = false;
    appPanel.hidden = true;
  }

  function showApp() {
    loginPanel.hidden = true;
    appPanel.hidden = false;
  }

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  }

  function statusText() {
    if (!state.prefix) {
      return state.folders.length ? "专题列表已更新。" : "当前还没有专题。";
    }
    if (state.topic) {
      return "专题资料和成果已更新。";
    }
    return state.files.length || state.folders.length ? "目录已更新。" : "当前目录为空。";
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

  function isTopicRoot(prefix) {
    return prefix.split("/").filter(Boolean).length === 1;
  }

  function isPreviewable(name) {
    return previewExtensions.has(extension(name));
  }

  function normalizeClientRelativePath(value) {
    return String(value || "").replace(/\\/g, "/").replace(/^\/+/, "").split("/").filter(Boolean).join("/");
  }

  function directoryPrefix(path) {
    const index = path.lastIndexOf("/");
    return index === -1 ? "" : path.slice(0, index + 1);
  }

  function fileNameFromPath(path) {
    const index = path.lastIndexOf("/");
    return index === -1 ? path : path.slice(index + 1);
  }

  function extension(name) {
    const index = name.lastIndexOf(".");
    return index === -1 ? "" : name.slice(index + 1).toLowerCase();
  }

  function fileLabel(file) {
    if (file.kind === "output") {
      return "成果";
    }
    if (file.kind === "prompt") {
      return "提示词";
    }
    const ext = extension(file.name);
    return ext ? ext.toUpperCase() : formatBytes(file.size);
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

  function formatDateTime(value) {
    if (!value) {
      return "-";
    }
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
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
