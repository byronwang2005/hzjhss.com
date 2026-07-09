import { onRequestPost as __api_drive_agent_manifest_ts_onRequestPost } from "/Users/macbook/git/hzjhss.com/functions/api/drive/agent-manifest.ts"
import { onRequestPost as __api_drive_download_url_ts_onRequestPost } from "/Users/macbook/git/hzjhss.com/functions/api/drive/download-url.ts"
import { onRequestPost as __api_drive_folder_ts_onRequestPost } from "/Users/macbook/git/hzjhss.com/functions/api/drive/folder.ts"
import { onRequestGet as __api_drive_list_ts_onRequestGet } from "/Users/macbook/git/hzjhss.com/functions/api/drive/list.ts"
import { onRequestPost as __api_drive_login_ts_onRequestPost } from "/Users/macbook/git/hzjhss.com/functions/api/drive/login.ts"
import { onRequestPost as __api_drive_logout_ts_onRequestPost } from "/Users/macbook/git/hzjhss.com/functions/api/drive/logout.ts"
import { onRequestDelete as __api_drive_object_ts_onRequestDelete } from "/Users/macbook/git/hzjhss.com/functions/api/drive/object.ts"
import { onRequestDelete as __api_drive_topic_ts_onRequestDelete } from "/Users/macbook/git/hzjhss.com/functions/api/drive/topic.ts"
import { onRequestGet as __api_drive_topic_ts_onRequestGet } from "/Users/macbook/git/hzjhss.com/functions/api/drive/topic.ts"
import { onRequestPost as __api_drive_topic_ts_onRequestPost } from "/Users/macbook/git/hzjhss.com/functions/api/drive/topic.ts"
import { onRequestPut as __api_drive_topic_ts_onRequestPut } from "/Users/macbook/git/hzjhss.com/functions/api/drive/topic.ts"
import { onRequestPost as __api_drive_upload_complete_ts_onRequestPost } from "/Users/macbook/git/hzjhss.com/functions/api/drive/upload-complete.ts"
import { onRequestPost as __api_drive_upload_url_ts_onRequestPost } from "/Users/macbook/git/hzjhss.com/functions/api/drive/upload-url.ts"

export const routes = [
    {
      routePath: "/api/drive/agent-manifest",
      mountPath: "/api/drive",
      method: "POST",
      middlewares: [],
      modules: [__api_drive_agent_manifest_ts_onRequestPost],
    },
  {
      routePath: "/api/drive/download-url",
      mountPath: "/api/drive",
      method: "POST",
      middlewares: [],
      modules: [__api_drive_download_url_ts_onRequestPost],
    },
  {
      routePath: "/api/drive/folder",
      mountPath: "/api/drive",
      method: "POST",
      middlewares: [],
      modules: [__api_drive_folder_ts_onRequestPost],
    },
  {
      routePath: "/api/drive/list",
      mountPath: "/api/drive",
      method: "GET",
      middlewares: [],
      modules: [__api_drive_list_ts_onRequestGet],
    },
  {
      routePath: "/api/drive/login",
      mountPath: "/api/drive",
      method: "POST",
      middlewares: [],
      modules: [__api_drive_login_ts_onRequestPost],
    },
  {
      routePath: "/api/drive/logout",
      mountPath: "/api/drive",
      method: "POST",
      middlewares: [],
      modules: [__api_drive_logout_ts_onRequestPost],
    },
  {
      routePath: "/api/drive/object",
      mountPath: "/api/drive",
      method: "DELETE",
      middlewares: [],
      modules: [__api_drive_object_ts_onRequestDelete],
    },
  {
      routePath: "/api/drive/topic",
      mountPath: "/api/drive",
      method: "DELETE",
      middlewares: [],
      modules: [__api_drive_topic_ts_onRequestDelete],
    },
  {
      routePath: "/api/drive/topic",
      mountPath: "/api/drive",
      method: "GET",
      middlewares: [],
      modules: [__api_drive_topic_ts_onRequestGet],
    },
  {
      routePath: "/api/drive/topic",
      mountPath: "/api/drive",
      method: "POST",
      middlewares: [],
      modules: [__api_drive_topic_ts_onRequestPost],
    },
  {
      routePath: "/api/drive/topic",
      mountPath: "/api/drive",
      method: "PUT",
      middlewares: [],
      modules: [__api_drive_topic_ts_onRequestPut],
    },
  {
      routePath: "/api/drive/upload-complete",
      mountPath: "/api/drive",
      method: "POST",
      middlewares: [],
      modules: [__api_drive_upload_complete_ts_onRequestPost],
    },
  {
      routePath: "/api/drive/upload-url",
      mountPath: "/api/drive",
      method: "POST",
      middlewares: [],
      modules: [__api_drive_upload_url_ts_onRequestPost],
    },
  ]