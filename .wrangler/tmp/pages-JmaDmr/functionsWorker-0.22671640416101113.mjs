var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../src/drive/config.ts
function getRequiredEnv(env, key) {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
function normalizeRootPrefix(value = DEFAULT_ROOT_PREFIX) {
  const clean = value.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/").trim();
  if (!clean) {
    return "";
  }
  return clean.endsWith("/") ? clean : `${clean}/`;
}
function getDriveConfig(env) {
  const bucket = getRequiredEnv(env, "COS_BUCKET");
  const region = getRequiredEnv(env, "COS_REGION");
  const endpoint = env.COS_ENDPOINT ? normalizeEndpoint(env.COS_ENDPOINT) : `https://${bucket}.cos.${region}.myqcloud.com`;
  return {
    cosSecretId: getRequiredEnv(env, "COS_SECRET_ID"),
    cosSecretKey: getRequiredEnv(env, "COS_SECRET_KEY"),
    bucket,
    region,
    endpoint,
    rootPrefix: normalizeRootPrefix(env.DRIVE_ROOT_PREFIX),
    maxFileBytes: parsePositiveInt(env.DRIVE_MAX_FILE_MB, DEFAULT_MAX_FILE_MB) * 1024 * 1024,
    signExpiresSeconds: Math.min(
      parsePositiveInt(env.DRIVE_SIGN_EXPIRES_SECONDS, DEFAULT_SIGN_EXPIRES_SECONDS),
      MAX_SIGN_EXPIRES_SECONDS
    ),
    sessionMaxAgeSeconds: parsePositiveInt(env.DRIVE_SESSION_MAX_AGE_SECONDS, DEFAULT_SESSION_MAX_AGE_SECONDS)
  };
}
function normalizeEndpoint(value) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(withProtocol);
  url.pathname = "";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}
function parsePositiveInt(value, fallback) {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
var DEFAULT_ROOT_PREFIX, DEFAULT_MAX_FILE_MB, DEFAULT_SIGN_EXPIRES_SECONDS, MAX_SIGN_EXPIRES_SECONDS, DEFAULT_SESSION_MAX_AGE_SECONDS;
var init_config = __esm({
  "../src/drive/config.ts"() {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    DEFAULT_ROOT_PREFIX = "cloud-drive/";
    DEFAULT_MAX_FILE_MB = 512;
    DEFAULT_SIGN_EXPIRES_SECONDS = 900;
    MAX_SIGN_EXPIRES_SECONDS = 3600;
    DEFAULT_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
    __name(getRequiredEnv, "getRequiredEnv");
    __name(normalizeRootPrefix, "normalizeRootPrefix");
    __name(getDriveConfig, "getDriveConfig");
    __name(normalizeEndpoint, "normalizeEndpoint");
    __name(parsePositiveInt, "parsePositiveInt");
  }
});

// ../src/drive/session.ts
async function createSessionCookie(env, requestUrl, displayName) {
  const now = Math.floor(Date.now() / 1e3);
  const maxAge = getSessionMaxAgeSeconds(env);
  const payload = {
    iat: now,
    exp: now + maxAge,
    displayName: normalizeDisplayName(displayName)
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(encodedPayload, getRequiredEnv(env, "DRIVE_SESSION_SECRET"));
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodedPayload}.${signature}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}
function getSessionMaxAgeSeconds(env) {
  const parsed = Number.parseInt(env.DRIVE_SESSION_MAX_AGE_SECONDS || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SESSION_MAX_AGE_SECONDS2;
}
function clearSessionCookie(requestUrl) {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
}
async function getDriveSession(env, cookieHeader) {
  const value = parseCookie(cookieHeader, COOKIE_NAME);
  if (!value) {
    return null;
  }
  const [encodedPayload, providedSignature] = value.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }
  const expectedSignature = await sign(encodedPayload, getRequiredEnv(env, "DRIVE_SESSION_SECRET"));
  if (!constantTimeEqual(providedSignature, expectedSignature)) {
    return null;
  }
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (!Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1e3)) {
      return null;
    }
    if (typeof payload.displayName !== "string" || !payload.displayName.trim()) {
      return null;
    }
    return {
      iat: Number(payload.iat) || 0,
      exp: payload.exp,
      displayName: normalizeDisplayName(payload.displayName)
    };
  } catch {
    return null;
  }
}
async function verifyAccessCode(env, provided) {
  if (typeof provided !== "string") {
    return false;
  }
  const expected = getRequiredEnv(env, "DRIVE_ACCESS_CODE");
  const expectedDigest = await digest(expected);
  const providedDigest = await digest(provided.trim());
  return constantTimeEqual(expectedDigest, providedDigest);
}
function normalizeDisplayName(input) {
  if (typeof input !== "string") {
    throw new Error("\u8BF7\u8F93\u5165\u767B\u5F55\u59D3\u540D");
  }
  const displayName = input.trim().replace(/\s+/g, " ");
  if (!displayName) {
    throw new Error("\u8BF7\u8F93\u5165\u767B\u5F55\u59D3\u540D");
  }
  if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    throw new Error("\u767B\u5F55\u59D3\u540D\u8FC7\u957F");
  }
  if (CONTROL_CHARS.test(displayName)) {
    throw new Error("\u767B\u5F55\u59D3\u540D\u5305\u542B\u975E\u6CD5\u5B57\u7B26");
  }
  return displayName;
}
function parseCookie(cookieHeader, name) {
  if (!cookieHeader) {
    return null;
  }
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey === name) {
      return rawValue.join("=");
    }
  }
  return null;
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}
async function digest(value) {
  const hash2 = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64UrlEncodeBytes(new Uint8Array(hash2));
}
function constantTimeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}
function base64UrlEncode(value) {
  return base64UrlEncodeBytes(new TextEncoder().encode(value));
}
function base64UrlEncodeBytes(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
var COOKIE_NAME, CONTROL_CHARS, MAX_DISPLAY_NAME_LENGTH, DEFAULT_SESSION_MAX_AGE_SECONDS2;
var init_session = __esm({
  "../src/drive/session.ts"() {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    init_config();
    COOKIE_NAME = "jhss_drive_session";
    CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
    MAX_DISPLAY_NAME_LENGTH = 40;
    DEFAULT_SESSION_MAX_AGE_SECONDS2 = 8 * 60 * 60;
    __name(createSessionCookie, "createSessionCookie");
    __name(getSessionMaxAgeSeconds, "getSessionMaxAgeSeconds");
    __name(clearSessionCookie, "clearSessionCookie");
    __name(getDriveSession, "getDriveSession");
    __name(verifyAccessCode, "verifyAccessCode");
    __name(normalizeDisplayName, "normalizeDisplayName");
    __name(parseCookie, "parseCookie");
    __name(sign, "sign");
    __name(digest, "digest");
    __name(constantTimeEqual, "constantTimeEqual");
    __name(base64UrlEncode, "base64UrlEncode");
    __name(base64UrlEncodeBytes, "base64UrlEncodeBytes");
    __name(base64UrlDecode, "base64UrlDecode");
  }
});

// ../src/drive/http.ts
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers
    }
  });
}
async function readJsonBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : {};
  } catch {
    return {};
  }
}
async function requireDriveSession(context) {
  const ok = await getDriveSession(context.env, context.request.headers.get("cookie"));
  return ok ? null : jsonResponse({ error: "\u8BF7\u5148\u8F93\u5165\u59D3\u540D\u548C\u8BBF\u95EE\u7801" }, 401);
}
async function readDriveSession(context) {
  const session = await getDriveSession(context.env, context.request.headers.get("cookie"));
  return session ?? jsonResponse({ error: "\u8BF7\u5148\u8F93\u5165\u59D3\u540D\u548C\u8BBF\u95EE\u7801" }, 401);
}
function errorResponse(error) {
  const message = error instanceof Error ? error.message : "\u8BF7\u6C42\u5904\u7406\u5931\u8D25";
  const status = message.includes("Missing required environment variable") ? 500 : 400;
  return jsonResponse({ error: message }, status);
}
var init_http = __esm({
  "../src/drive/http.ts"() {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    init_session();
    __name(jsonResponse, "jsonResponse");
    __name(readJsonBody, "readJsonBody");
    __name(requireDriveSession, "requireDriveSession");
    __name(readDriveSession, "readDriveSession");
    __name(errorResponse, "errorResponse");
  }
});

// ../node_modules/aws4fetch/dist/aws4fetch.esm.mjs
async function hmac(key, string) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    typeof key === "string" ? encoder.encode(key) : key,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(string));
}
async function hash(content) {
  return crypto.subtle.digest("SHA-256", typeof content === "string" ? encoder.encode(content) : content);
}
function buf2hex(arrayBuffer) {
  const buffer = new Uint8Array(arrayBuffer);
  let out = "";
  for (let idx = 0; idx < buffer.length; idx++) {
    const n = buffer[idx];
    out += HEX_CHARS[n >>> 4 & 15];
    out += HEX_CHARS[n & 15];
  }
  return out;
}
function encodeRfc3986(urlEncodedStr) {
  return urlEncodedStr.replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}
function guessServiceRegion(url, headers) {
  const { hostname, pathname } = url;
  if (hostname.endsWith(".on.aws")) {
    const match3 = hostname.match(/^[^.]{1,63}\.lambda-url\.([^.]{1,63})\.on\.aws$/);
    return match3 != null ? ["lambda", match3[1] || ""] : ["", ""];
  }
  if (hostname.endsWith(".r2.cloudflarestorage.com")) {
    return ["s3", "auto"];
  }
  if (hostname.endsWith(".backblazeb2.com")) {
    const match3 = hostname.match(/^(?:[^.]{1,63}\.)?s3\.([^.]{1,63})\.backblazeb2\.com$/);
    return match3 != null ? ["s3", match3[1] || ""] : ["", ""];
  }
  const match2 = hostname.replace("dualstack.", "").match(/([^.]{1,63})\.(?:([^.]{0,63})\.)?amazonaws\.com(?:\.cn)?$/);
  let service = match2 && match2[1] || "";
  let region = match2 && match2[2];
  if (region === "us-gov") {
    region = "us-gov-west-1";
  } else if (region === "s3" || region === "s3-accelerate") {
    region = "us-east-1";
    service = "s3";
  } else if (service === "iot") {
    if (hostname.startsWith("iot.")) {
      service = "execute-api";
    } else if (hostname.startsWith("data.jobs.iot.")) {
      service = "iot-jobs-data";
    } else {
      service = pathname === "/mqtt" ? "iotdevicegateway" : "iotdata";
    }
  } else if (service === "autoscaling") {
    const targetPrefix = (headers.get("X-Amz-Target") || "").split(".")[0];
    if (targetPrefix === "AnyScaleFrontendService") {
      service = "application-autoscaling";
    } else if (targetPrefix === "AnyScaleScalingPlannerFrontendService") {
      service = "autoscaling-plans";
    }
  } else if (region == null && service.startsWith("s3-")) {
    region = service.slice(3).replace(/^fips-|^external-1/, "");
    service = "s3";
  } else if (service.endsWith("-fips")) {
    service = service.slice(0, -5);
  } else if (region && /-\d$/.test(service) && !/-\d$/.test(region)) {
    [service, region] = [region, service];
  }
  return [HOST_SERVICES[service] || service, region || ""];
}
var encoder, HOST_SERVICES, UNSIGNABLE_HEADERS, AwsClient, AwsV4Signer, HEX_CHARS;
var init_aws4fetch_esm = __esm({
  "../node_modules/aws4fetch/dist/aws4fetch.esm.mjs"() {
    init_functionsRoutes_0_33282656970487656();
    encoder = new TextEncoder();
    HOST_SERVICES = {
      appstream2: "appstream",
      cloudhsmv2: "cloudhsm",
      email: "ses",
      marketplace: "aws-marketplace",
      mobile: "AWSMobileHubService",
      pinpoint: "mobiletargeting",
      queue: "sqs",
      "git-codecommit": "codecommit",
      "mturk-requester-sandbox": "mturk-requester",
      "personalize-runtime": "personalize"
    };
    UNSIGNABLE_HEADERS = /* @__PURE__ */ new Set([
      "authorization",
      "content-type",
      "content-length",
      "user-agent",
      "presigned-expires",
      "expect",
      "x-amzn-trace-id",
      "range",
      "connection"
    ]);
    AwsClient = class {
      static {
        __name(this, "AwsClient");
      }
      constructor({ accessKeyId, secretAccessKey, sessionToken, service, region, cache, retries, initRetryMs }) {
        if (accessKeyId == null) throw new TypeError("accessKeyId is a required option");
        if (secretAccessKey == null) throw new TypeError("secretAccessKey is a required option");
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this.sessionToken = sessionToken;
        this.service = service;
        this.region = region;
        this.cache = cache || /* @__PURE__ */ new Map();
        this.retries = retries != null ? retries : 10;
        this.initRetryMs = initRetryMs || 50;
      }
      async sign(input, init) {
        if (input instanceof Request) {
          const { method, url, headers, body } = input;
          init = Object.assign({ method, url, headers }, init);
          if (init.body == null && headers.has("Content-Type")) {
            init.body = body != null && headers.has("X-Amz-Content-Sha256") ? body : await input.clone().arrayBuffer();
          }
          input = url;
        }
        const signer = new AwsV4Signer(Object.assign({ url: input.toString() }, init, this, init && init.aws));
        const signed = Object.assign({}, init, await signer.sign());
        delete signed.aws;
        try {
          return new Request(signed.url.toString(), signed);
        } catch (e) {
          if (e instanceof TypeError) {
            return new Request(signed.url.toString(), Object.assign({ duplex: "half" }, signed));
          }
          throw e;
        }
      }
      async fetch(input, init) {
        for (let i = 0; i <= this.retries; i++) {
          const fetched = fetch(await this.sign(input, init));
          if (i === this.retries) {
            return fetched;
          }
          const res = await fetched;
          if (res.status < 500 && res.status !== 429) {
            return res;
          }
          await new Promise((resolve) => setTimeout(resolve, Math.random() * this.initRetryMs * Math.pow(2, i)));
        }
        throw new Error("An unknown error occurred, ensure retries is not negative");
      }
    };
    AwsV4Signer = class {
      static {
        __name(this, "AwsV4Signer");
      }
      constructor({ method, url, headers, body, accessKeyId, secretAccessKey, sessionToken, service, region, cache, datetime, signQuery, appendSessionToken, allHeaders, singleEncode }) {
        if (url == null) throw new TypeError("url is a required option");
        if (accessKeyId == null) throw new TypeError("accessKeyId is a required option");
        if (secretAccessKey == null) throw new TypeError("secretAccessKey is a required option");
        this.method = method || (body ? "POST" : "GET");
        this.url = new URL(url);
        this.headers = new Headers(headers || {});
        this.body = body;
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this.sessionToken = sessionToken;
        let guessedService, guessedRegion;
        if (!service || !region) {
          [guessedService, guessedRegion] = guessServiceRegion(this.url, this.headers);
        }
        this.service = service || guessedService || "";
        this.region = region || guessedRegion || "us-east-1";
        this.cache = cache || /* @__PURE__ */ new Map();
        this.datetime = datetime || (/* @__PURE__ */ new Date()).toISOString().replace(/[:-]|\.\d{3}/g, "");
        this.signQuery = signQuery;
        this.appendSessionToken = appendSessionToken || this.service === "iotdevicegateway";
        this.headers.delete("Host");
        if (this.service === "s3" && !this.signQuery && !this.headers.has("X-Amz-Content-Sha256")) {
          this.headers.set("X-Amz-Content-Sha256", "UNSIGNED-PAYLOAD");
        }
        const params = this.signQuery ? this.url.searchParams : this.headers;
        params.set("X-Amz-Date", this.datetime);
        if (this.sessionToken && !this.appendSessionToken) {
          params.set("X-Amz-Security-Token", this.sessionToken);
        }
        this.signableHeaders = ["host", ...this.headers.keys()].filter((header) => allHeaders || !UNSIGNABLE_HEADERS.has(header)).sort();
        this.signedHeaders = this.signableHeaders.join(";");
        this.canonicalHeaders = this.signableHeaders.map((header) => header + ":" + (header === "host" ? this.url.host : (this.headers.get(header) || "").replace(/\s+/g, " "))).join("\n");
        this.credentialString = [this.datetime.slice(0, 8), this.region, this.service, "aws4_request"].join("/");
        if (this.signQuery) {
          if (this.service === "s3" && !params.has("X-Amz-Expires")) {
            params.set("X-Amz-Expires", "86400");
          }
          params.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
          params.set("X-Amz-Credential", this.accessKeyId + "/" + this.credentialString);
          params.set("X-Amz-SignedHeaders", this.signedHeaders);
        }
        if (this.service === "s3") {
          try {
            this.encodedPath = decodeURIComponent(this.url.pathname.replace(/\+/g, " "));
          } catch (e) {
            this.encodedPath = this.url.pathname;
          }
        } else {
          this.encodedPath = this.url.pathname.replace(/\/+/g, "/");
        }
        if (!singleEncode) {
          this.encodedPath = encodeURIComponent(this.encodedPath).replace(/%2F/g, "/");
        }
        this.encodedPath = encodeRfc3986(this.encodedPath);
        const seenKeys = /* @__PURE__ */ new Set();
        this.encodedSearch = [...this.url.searchParams].filter(([k]) => {
          if (!k) return false;
          if (this.service === "s3") {
            if (seenKeys.has(k)) return false;
            seenKeys.add(k);
          }
          return true;
        }).map((pair) => pair.map((p) => encodeRfc3986(encodeURIComponent(p)))).sort(([k1, v1], [k2, v2]) => k1 < k2 ? -1 : k1 > k2 ? 1 : v1 < v2 ? -1 : v1 > v2 ? 1 : 0).map((pair) => pair.join("=")).join("&");
      }
      async sign() {
        if (this.signQuery) {
          this.url.searchParams.set("X-Amz-Signature", await this.signature());
          if (this.sessionToken && this.appendSessionToken) {
            this.url.searchParams.set("X-Amz-Security-Token", this.sessionToken);
          }
        } else {
          this.headers.set("Authorization", await this.authHeader());
        }
        return {
          method: this.method,
          url: this.url,
          headers: this.headers,
          body: this.body
        };
      }
      async authHeader() {
        return [
          "AWS4-HMAC-SHA256 Credential=" + this.accessKeyId + "/" + this.credentialString,
          "SignedHeaders=" + this.signedHeaders,
          "Signature=" + await this.signature()
        ].join(", ");
      }
      async signature() {
        const date = this.datetime.slice(0, 8);
        const cacheKey = [this.secretAccessKey, date, this.region, this.service].join();
        let kCredentials = this.cache.get(cacheKey);
        if (!kCredentials) {
          const kDate = await hmac("AWS4" + this.secretAccessKey, date);
          const kRegion = await hmac(kDate, this.region);
          const kService = await hmac(kRegion, this.service);
          kCredentials = await hmac(kService, "aws4_request");
          this.cache.set(cacheKey, kCredentials);
        }
        return buf2hex(await hmac(kCredentials, await this.stringToSign()));
      }
      async stringToSign() {
        return [
          "AWS4-HMAC-SHA256",
          this.datetime,
          this.credentialString,
          buf2hex(await hash(await this.canonicalString()))
        ].join("\n");
      }
      async canonicalString() {
        return [
          this.method.toUpperCase(),
          this.encodedPath,
          this.encodedSearch,
          this.canonicalHeaders + "\n",
          this.signedHeaders,
          await this.hexBodyHash()
        ].join("\n");
      }
      async hexBodyHash() {
        let hashHeader = this.headers.get("X-Amz-Content-Sha256") || (this.service === "s3" && this.signQuery ? "UNSIGNED-PAYLOAD" : null);
        if (hashHeader == null) {
          if (this.body && typeof this.body !== "string" && !("byteLength" in this.body)) {
            throw new Error("body must be a string, ArrayBuffer or ArrayBufferView, unless you include the X-Amz-Content-Sha256 header");
          }
          hashHeader = buf2hex(await hash(this.body || ""));
        }
        return hashHeader;
      }
    };
    __name(hmac, "hmac");
    __name(hash, "hash");
    HEX_CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
    __name(buf2hex, "buf2hex");
    __name(encodeRfc3986, "encodeRfc3986");
    __name(guessServiceRegion, "guessServiceRegion");
  }
});

// ../node_modules/fast-xml-parser/src/util.js
var require_util = __commonJS({
  "../node_modules/fast-xml-parser/src/util.js"(exports) {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    var nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
    var nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
    var nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
    var regexName = new RegExp("^" + nameRegexp + "$");
    var getAllMatches = /* @__PURE__ */ __name(function(string, regex) {
      const matches = [];
      let match2 = regex.exec(string);
      while (match2) {
        const allmatches = [];
        allmatches.startIndex = regex.lastIndex - match2[0].length;
        const len = match2.length;
        for (let index = 0; index < len; index++) {
          allmatches.push(match2[index]);
        }
        matches.push(allmatches);
        match2 = regex.exec(string);
      }
      return matches;
    }, "getAllMatches");
    var isName = /* @__PURE__ */ __name(function(string) {
      const match2 = regexName.exec(string);
      return !(match2 === null || typeof match2 === "undefined");
    }, "isName");
    exports.isExist = function(v) {
      return typeof v !== "undefined";
    };
    exports.isEmptyObject = function(obj) {
      return Object.keys(obj).length === 0;
    };
    exports.merge = function(target, a, arrayMode) {
      if (a) {
        const keys = Object.keys(a);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
          if (arrayMode === "strict") {
            target[keys[i]] = [a[keys[i]]];
          } else {
            target[keys[i]] = a[keys[i]];
          }
        }
      }
    };
    exports.getValue = function(v) {
      if (exports.isExist(v)) {
        return v;
      } else {
        return "";
      }
    };
    var DANGEROUS_PROPERTY_NAMES = [
      // '__proto__',
      // 'constructor',
      // 'prototype',
      "hasOwnProperty",
      "toString",
      "valueOf",
      "__defineGetter__",
      "__defineSetter__",
      "__lookupGetter__",
      "__lookupSetter__"
    ];
    var criticalProperties = ["__proto__", "constructor", "prototype"];
    exports.isName = isName;
    exports.getAllMatches = getAllMatches;
    exports.nameRegexp = nameRegexp;
    exports.DANGEROUS_PROPERTY_NAMES = DANGEROUS_PROPERTY_NAMES;
    exports.criticalProperties = criticalProperties;
  }
});

// ../node_modules/fast-xml-parser/src/validator.js
var require_validator = __commonJS({
  "../node_modules/fast-xml-parser/src/validator.js"(exports) {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    var util = require_util();
    var defaultOptions = {
      allowBooleanAttributes: false,
      //A tag can have attributes without any value
      unpairedTags: []
    };
    exports.validate = function(xmlData, options) {
      options = Object.assign({}, defaultOptions, options);
      const tags = [];
      let tagFound = false;
      let reachedRoot = false;
      if (xmlData[0] === "\uFEFF") {
        xmlData = xmlData.substr(1);
      }
      for (let i = 0; i < xmlData.length; i++) {
        if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
          i += 2;
          i = readPI(xmlData, i);
          if (i.err) return i;
        } else if (xmlData[i] === "<") {
          let tagStartPos = i;
          i++;
          if (xmlData[i] === "!") {
            i = readCommentAndCDATA(xmlData, i);
            continue;
          } else {
            let closingTag = false;
            if (xmlData[i] === "/") {
              closingTag = true;
              i++;
            }
            let tagName = "";
            for (; i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "	" && xmlData[i] !== "\n" && xmlData[i] !== "\r"; i++) {
              tagName += xmlData[i];
            }
            tagName = tagName.trim();
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substring(0, tagName.length - 1);
              i--;
            }
            if (!validateTagName(tagName)) {
              let msg;
              if (tagName.trim().length === 0) {
                msg = "Invalid space after '<'.";
              } else {
                msg = "Tag '" + tagName + "' is an invalid name.";
              }
              return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
            }
            const result = readAttributeStr(xmlData, i);
            if (result === false) {
              return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
            }
            let attrStr = result.value;
            i = result.index;
            if (attrStr[attrStr.length - 1] === "/") {
              const attrStrStart = i - attrStr.length;
              attrStr = attrStr.substring(0, attrStr.length - 1);
              const isValid = validateAttributeString(attrStr, options);
              if (isValid === true) {
                tagFound = true;
              } else {
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
              }
            } else if (closingTag) {
              if (!result.tagClosed) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
              } else if (attrStr.trim().length > 0) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
              } else if (tags.length === 0) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
              } else {
                const otg = tags.pop();
                if (tagName !== otg.tagName) {
                  let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
                  return getErrorObject(
                    "InvalidTag",
                    "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.",
                    getLineNumberForPosition(xmlData, tagStartPos)
                  );
                }
                if (tags.length == 0) {
                  reachedRoot = true;
                }
              }
            } else {
              const isValid = validateAttributeString(attrStr, options);
              if (isValid !== true) {
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
              }
              if (reachedRoot === true) {
                return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
              } else if (options.unpairedTags.indexOf(tagName) !== -1) {
              } else {
                tags.push({ tagName, tagStartPos });
              }
              tagFound = true;
            }
            for (i++; i < xmlData.length; i++) {
              if (xmlData[i] === "<") {
                if (xmlData[i + 1] === "!") {
                  i++;
                  i = readCommentAndCDATA(xmlData, i);
                  continue;
                } else if (xmlData[i + 1] === "?") {
                  i = readPI(xmlData, ++i);
                  if (i.err) return i;
                } else {
                  break;
                }
              } else if (xmlData[i] === "&") {
                const afterAmp = validateAmpersand(xmlData, i);
                if (afterAmp == -1)
                  return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
                i = afterAmp;
              } else {
                if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
                  return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
                }
              }
            }
            if (xmlData[i] === "<") {
              i--;
            }
          }
        } else {
          if (isWhiteSpace(xmlData[i])) {
            continue;
          }
          return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
        }
      }
      if (!tagFound) {
        return getErrorObject("InvalidXml", "Start tag expected.", 1);
      } else if (tags.length == 1) {
        return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
      } else if (tags.length > 0) {
        return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
      }
      return true;
    };
    function isWhiteSpace(char) {
      return char === " " || char === "	" || char === "\n" || char === "\r";
    }
    __name(isWhiteSpace, "isWhiteSpace");
    function readPI(xmlData, i) {
      const start = i;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] == "?" || xmlData[i] == " ") {
          const tagname = xmlData.substr(start, i - start);
          if (i > 5 && tagname === "xml") {
            return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
          } else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
            i++;
            break;
          } else {
            continue;
          }
        }
      }
      return i;
    }
    __name(readPI, "readPI");
    function readCommentAndCDATA(xmlData, i) {
      if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
        for (i += 3; i < xmlData.length; i++) {
          if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
            i += 2;
            break;
          }
        }
      } else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
        let angleBracketsCount = 1;
        for (i += 8; i < xmlData.length; i++) {
          if (xmlData[i] === "<") {
            angleBracketsCount++;
          } else if (xmlData[i] === ">") {
            angleBracketsCount--;
            if (angleBracketsCount === 0) {
              break;
            }
          }
        }
      } else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
        for (i += 8; i < xmlData.length; i++) {
          if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
            i += 2;
            break;
          }
        }
      }
      return i;
    }
    __name(readCommentAndCDATA, "readCommentAndCDATA");
    var doubleQuote = '"';
    var singleQuote = "'";
    function readAttributeStr(xmlData, i) {
      let attrStr = "";
      let startChar = "";
      let tagClosed = false;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
          if (startChar === "") {
            startChar = xmlData[i];
          } else if (startChar !== xmlData[i]) {
          } else {
            startChar = "";
          }
        } else if (xmlData[i] === ">") {
          if (startChar === "") {
            tagClosed = true;
            break;
          }
        }
        attrStr += xmlData[i];
      }
      if (startChar !== "") {
        return false;
      }
      return {
        value: attrStr,
        index: i,
        tagClosed
      };
    }
    __name(readAttributeStr, "readAttributeStr");
    var validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
    function validateAttributeString(attrStr, options) {
      const matches = util.getAllMatches(attrStr, validAttrStrRegxp);
      const attrNames = {};
      for (let i = 0; i < matches.length; i++) {
        if (matches[i][1].length === 0) {
          return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
        } else if (matches[i][3] !== void 0 && matches[i][4] === void 0) {
          return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' is without value.", getPositionFromMatch(matches[i]));
        } else if (matches[i][3] === void 0 && !options.allowBooleanAttributes) {
          return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
        }
        const attrName = matches[i][2];
        if (!validateAttrName(attrName)) {
          return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
        }
        if (!attrNames.hasOwnProperty(attrName)) {
          attrNames[attrName] = 1;
        } else {
          return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
        }
      }
      return true;
    }
    __name(validateAttributeString, "validateAttributeString");
    function validateNumberAmpersand(xmlData, i) {
      let re = /\d/;
      if (xmlData[i] === "x") {
        i++;
        re = /[\da-fA-F]/;
      }
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === ";")
          return i;
        if (!xmlData[i].match(re))
          break;
      }
      return -1;
    }
    __name(validateNumberAmpersand, "validateNumberAmpersand");
    function validateAmpersand(xmlData, i) {
      i++;
      if (xmlData[i] === ";")
        return -1;
      if (xmlData[i] === "#") {
        i++;
        return validateNumberAmpersand(xmlData, i);
      }
      let count = 0;
      for (; i < xmlData.length; i++, count++) {
        if (xmlData[i].match(/\w/) && count < 20)
          continue;
        if (xmlData[i] === ";")
          break;
        return -1;
      }
      return i;
    }
    __name(validateAmpersand, "validateAmpersand");
    function getErrorObject(code, message, lineNumber) {
      return {
        err: {
          code,
          msg: message,
          line: lineNumber.line || lineNumber,
          col: lineNumber.col
        }
      };
    }
    __name(getErrorObject, "getErrorObject");
    function validateAttrName(attrName) {
      return util.isName(attrName);
    }
    __name(validateAttrName, "validateAttrName");
    function validateTagName(tagname) {
      return util.isName(tagname);
    }
    __name(validateTagName, "validateTagName");
    function getLineNumberForPosition(xmlData, index) {
      const lines = xmlData.substring(0, index).split(/\r?\n/);
      return {
        line: lines.length,
        // column number is last line's length + 1, because column numbering starts at 1:
        col: lines[lines.length - 1].length + 1
      };
    }
    __name(getLineNumberForPosition, "getLineNumberForPosition");
    function getPositionFromMatch(match2) {
      return match2.startIndex + match2[1].length;
    }
    __name(getPositionFromMatch, "getPositionFromMatch");
  }
});

// ../node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
var require_OptionsBuilder = __commonJS({
  "../node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js"(exports) {
    init_functionsRoutes_0_33282656970487656();
    var { DANGEROUS_PROPERTY_NAMES, criticalProperties } = require_util();
    var defaultOnDangerousProperty = /* @__PURE__ */ __name((name) => {
      if (DANGEROUS_PROPERTY_NAMES.includes(name)) {
        return "__" + name;
      }
      return name;
    }, "defaultOnDangerousProperty");
    var defaultOptions = {
      preserveOrder: false,
      attributeNamePrefix: "@_",
      attributesGroupName: false,
      textNodeName: "#text",
      ignoreAttributes: true,
      removeNSPrefix: false,
      // remove NS from tag name or attribute name if true
      allowBooleanAttributes: false,
      //a tag can have attributes without any value
      //ignoreRootElement : false,
      parseTagValue: true,
      parseAttributeValue: false,
      trimValues: true,
      //Trim string values of tag and attributes
      cdataPropName: false,
      numberParseOptions: {
        hex: true,
        leadingZeros: true,
        eNotation: true
      },
      tagValueProcessor: /* @__PURE__ */ __name(function(tagName, val) {
        return val;
      }, "tagValueProcessor"),
      attributeValueProcessor: /* @__PURE__ */ __name(function(attrName, val) {
        return val;
      }, "attributeValueProcessor"),
      stopNodes: [],
      //nested tags will not be parsed even for errors
      alwaysCreateTextNode: false,
      isArray: /* @__PURE__ */ __name(() => false, "isArray"),
      commentPropName: false,
      unpairedTags: [],
      processEntities: true,
      htmlEntities: false,
      ignoreDeclaration: false,
      ignorePiTags: false,
      transformTagName: false,
      transformAttributeName: false,
      updateTag: /* @__PURE__ */ __name(function(tagName, jPath, attrs) {
        return tagName;
      }, "updateTag"),
      // skipEmptyListItem: false
      captureMetaData: false,
      maxNestedTags: 100,
      strictReservedNames: true,
      onDangerousProperty: defaultOnDangerousProperty
    };
    function validatePropertyName(propertyName, optionName) {
      if (typeof propertyName !== "string") {
        return;
      }
      const normalized = propertyName.toLowerCase();
      if (DANGEROUS_PROPERTY_NAMES.some((dangerous) => normalized === dangerous.toLowerCase())) {
        throw new Error(
          `[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`
        );
      }
      if (criticalProperties.some((dangerous) => normalized === dangerous.toLowerCase())) {
        throw new Error(
          `[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`
        );
      }
    }
    __name(validatePropertyName, "validatePropertyName");
    function normalizeProcessEntities(value) {
      if (typeof value === "boolean") {
        return {
          enabled: value,
          // true or false
          maxEntitySize: 1e4,
          maxExpansionDepth: 10,
          maxTotalExpansions: 1e3,
          maxExpandedLength: 1e5,
          allowedTags: null,
          tagFilter: null
        };
      }
      if (typeof value === "object" && value !== null) {
        return {
          enabled: value.enabled !== false,
          maxEntitySize: Math.max(1, value.maxEntitySize ?? 1e4),
          maxExpansionDepth: Math.max(1, value.maxExpansionDepth ?? 1e4),
          maxTotalExpansions: Math.max(1, value.maxTotalExpansions ?? Infinity),
          maxExpandedLength: Math.max(1, value.maxExpandedLength ?? 1e5),
          maxEntityCount: Math.max(1, value.maxEntityCount ?? 1e3),
          allowedTags: value.allowedTags ?? null,
          tagFilter: value.tagFilter ?? null
        };
      }
      return normalizeProcessEntities(true);
    }
    __name(normalizeProcessEntities, "normalizeProcessEntities");
    var buildOptions = /* @__PURE__ */ __name(function(options) {
      const built = Object.assign({}, defaultOptions, options);
      const propertyNameOptions = [
        { value: built.attributeNamePrefix, name: "attributeNamePrefix" },
        { value: built.attributesGroupName, name: "attributesGroupName" },
        { value: built.textNodeName, name: "textNodeName" },
        { value: built.cdataPropName, name: "cdataPropName" },
        { value: built.commentPropName, name: "commentPropName" }
      ];
      for (const { value, name } of propertyNameOptions) {
        if (value) {
          validatePropertyName(value, name);
        }
      }
      if (built.onDangerousProperty === null) {
        built.onDangerousProperty = defaultOnDangerousProperty;
      }
      built.processEntities = normalizeProcessEntities(built.processEntities);
      return built;
    }, "buildOptions");
    exports.buildOptions = buildOptions;
    exports.defaultOptions = defaultOptions;
  }
});

// ../node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
var require_xmlNode = __commonJS({
  "../node_modules/fast-xml-parser/src/xmlparser/xmlNode.js"(exports, module) {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    var XmlNode = class {
      static {
        __name(this, "XmlNode");
      }
      constructor(tagname) {
        this.tagname = tagname;
        this.child = [];
        this[":@"] = {};
      }
      add(key, val) {
        if (key === "__proto__") key = "#__proto__";
        this.child.push({ [key]: val });
      }
      addChild(node) {
        if (node.tagname === "__proto__") node.tagname = "#__proto__";
        if (node[":@"] && Object.keys(node[":@"]).length > 0) {
          this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
        } else {
          this.child.push({ [node.tagname]: node.child });
        }
      }
    };
    module.exports = XmlNode;
  }
});

// ../node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
var require_DocTypeReader = __commonJS({
  "../node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js"(exports, module) {
    init_functionsRoutes_0_33282656970487656();
    var util = require_util();
    var DocTypeReader = class {
      static {
        __name(this, "DocTypeReader");
      }
      constructor(options) {
        this.suppressValidationErr = !options;
        this.options = options || {};
      }
      readDocType(xmlData, i) {
        const entities = /* @__PURE__ */ Object.create(null);
        let entityCount = 0;
        if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
          i = i + 9;
          let angleBracketsCount = 1;
          let hasBody = false, comment = false;
          let exp = "";
          for (; i < xmlData.length; i++) {
            if (xmlData[i] === "<" && !comment) {
              if (hasBody && hasSeq(xmlData, "!ENTITY", i)) {
                i += 7;
                let entityName, val;
                [entityName, val, i] = this.readEntityExp(xmlData, i + 1, this.suppressValidationErr);
                if (val.indexOf("&") === -1) {
                  if (this.options.enabled !== false && this.options.maxEntityCount != null && entityCount >= this.options.maxEntityCount) {
                    throw new Error(
                      `Entity count (${entityCount + 1}) exceeds maximum allowed (${this.options.maxEntityCount})`
                    );
                  }
                  const escaped = entityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                  entities[entityName] = {
                    regx: RegExp(`&${escaped};`, "g"),
                    val
                  };
                  entityCount++;
                }
              } else if (hasBody && hasSeq(xmlData, "!ELEMENT", i)) {
                i += 8;
                const { index } = this.readElementExp(xmlData, i + 1);
                i = index;
              } else if (hasBody && hasSeq(xmlData, "!ATTLIST", i)) {
                i += 8;
              } else if (hasBody && hasSeq(xmlData, "!NOTATION", i)) {
                i += 9;
                const { index } = this.readNotationExp(xmlData, i + 1, this.suppressValidationErr);
                i = index;
              } else if (hasSeq(xmlData, "!--", i)) {
                comment = true;
              } else {
                throw new Error(`Invalid DOCTYPE`);
              }
              angleBracketsCount++;
              exp = "";
            } else if (xmlData[i] === ">") {
              if (comment) {
                if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
                  comment = false;
                  angleBracketsCount--;
                }
              } else {
                angleBracketsCount--;
              }
              if (angleBracketsCount === 0) {
                break;
              }
            } else if (xmlData[i] === "[") {
              hasBody = true;
            } else {
              exp += xmlData[i];
            }
          }
          if (angleBracketsCount !== 0) {
            throw new Error(`Unclosed DOCTYPE`);
          }
        } else {
          throw new Error(`Invalid Tag instead of DOCTYPE`);
        }
        return { entities, i };
      }
      readEntityExp(xmlData, i) {
        i = skipWhitespace(xmlData, i);
        let entityName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i]) && xmlData[i] !== '"' && xmlData[i] !== "'") {
          entityName += xmlData[i];
          i++;
        }
        validateEntityName(entityName);
        i = skipWhitespace(xmlData, i);
        if (!this.suppressValidationErr) {
          if (xmlData.substring(i, i + 6).toUpperCase() === "SYSTEM") {
            throw new Error("External entities are not supported");
          } else if (xmlData[i] === "%") {
            throw new Error("Parameter entities are not supported");
          }
        }
        let entityValue = "";
        [i, entityValue] = this.readIdentifierVal(xmlData, i, "entity");
        if (this.options.enabled !== false && this.options.maxEntitySize != null && entityValue.length > this.options.maxEntitySize) {
          throw new Error(
            `Entity "${entityName}" size (${entityValue.length}) exceeds maximum allowed size (${this.options.maxEntitySize})`
          );
        }
        i--;
        return [entityName, entityValue, i];
      }
      readNotationExp(xmlData, i) {
        i = skipWhitespace(xmlData, i);
        let notationName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          notationName += xmlData[i];
          i++;
        }
        !this.suppressValidationErr && validateEntityName(notationName);
        i = skipWhitespace(xmlData, i);
        const identifierType = xmlData.substring(i, i + 6).toUpperCase();
        if (!this.suppressValidationErr && identifierType !== "SYSTEM" && identifierType !== "PUBLIC") {
          throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
        }
        i += identifierType.length;
        i = skipWhitespace(xmlData, i);
        let publicIdentifier = null;
        let systemIdentifier = null;
        if (identifierType === "PUBLIC") {
          [i, publicIdentifier] = this.readIdentifierVal(xmlData, i, "publicIdentifier");
          i = skipWhitespace(xmlData, i);
          if (xmlData[i] === '"' || xmlData[i] === "'") {
            [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
          }
        } else if (identifierType === "SYSTEM") {
          [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
          if (!this.suppressValidationErr && !systemIdentifier) {
            throw new Error("Missing mandatory system identifier for SYSTEM notation");
          }
        }
        return { notationName, publicIdentifier, systemIdentifier, index: --i };
      }
      readIdentifierVal(xmlData, i, type) {
        let identifierVal = "";
        const startChar = xmlData[i];
        if (startChar !== '"' && startChar !== "'") {
          throw new Error(`Expected quoted string, found "${startChar}"`);
        }
        i++;
        while (i < xmlData.length && xmlData[i] !== startChar) {
          identifierVal += xmlData[i];
          i++;
        }
        if (xmlData[i] !== startChar) {
          throw new Error(`Unterminated ${type} value`);
        }
        i++;
        return [i, identifierVal];
      }
      readElementExp(xmlData, i) {
        i = skipWhitespace(xmlData, i);
        let elementName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          elementName += xmlData[i];
          i++;
        }
        if (!this.suppressValidationErr && !util.isName(elementName)) {
          throw new Error(`Invalid element name: "${elementName}"`);
        }
        i = skipWhitespace(xmlData, i);
        let contentModel = "";
        if (xmlData[i] === "E" && hasSeq(xmlData, "MPTY", i)) {
          i += 4;
        } else if (xmlData[i] === "A" && hasSeq(xmlData, "NY", i)) {
          i += 2;
        } else if (xmlData[i] === "(") {
          i++;
          while (i < xmlData.length && xmlData[i] !== ")") {
            contentModel += xmlData[i];
            i++;
          }
          if (xmlData[i] !== ")") {
            throw new Error("Unterminated content model");
          }
        } else if (!this.suppressValidationErr) {
          throw new Error(`Invalid Element Expression, found "${xmlData[i]}"`);
        }
        return {
          elementName,
          contentModel: contentModel.trim(),
          index: i
        };
      }
      readAttlistExp(xmlData, i) {
        i = skipWhitespace(xmlData, i);
        let elementName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          elementName += xmlData[i];
          i++;
        }
        validateEntityName(elementName);
        i = skipWhitespace(xmlData, i);
        let attributeName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          attributeName += xmlData[i];
          i++;
        }
        if (!validateEntityName(attributeName)) {
          throw new Error(`Invalid attribute name: "${attributeName}"`);
        }
        i = skipWhitespace(xmlData, i);
        let attributeType = "";
        if (xmlData.substring(i, i + 8).toUpperCase() === "NOTATION") {
          attributeType = "NOTATION";
          i += 8;
          i = skipWhitespace(xmlData, i);
          if (xmlData[i] !== "(") {
            throw new Error(`Expected '(', found "${xmlData[i]}"`);
          }
          i++;
          let allowedNotations = [];
          while (i < xmlData.length && xmlData[i] !== ")") {
            let notation = "";
            while (i < xmlData.length && xmlData[i] !== "|" && xmlData[i] !== ")") {
              notation += xmlData[i];
              i++;
            }
            notation = notation.trim();
            if (!validateEntityName(notation)) {
              throw new Error(`Invalid notation name: "${notation}"`);
            }
            allowedNotations.push(notation);
            if (xmlData[i] === "|") {
              i++;
              i = skipWhitespace(xmlData, i);
            }
          }
          if (xmlData[i] !== ")") {
            throw new Error("Unterminated list of notations");
          }
          i++;
          attributeType += " (" + allowedNotations.join("|") + ")";
        } else {
          while (i < xmlData.length && !/\s/.test(xmlData[i])) {
            attributeType += xmlData[i];
            i++;
          }
          const validTypes = ["CDATA", "ID", "IDREF", "IDREFS", "ENTITY", "ENTITIES", "NMTOKEN", "NMTOKENS"];
          if (!this.suppressValidationErr && !validTypes.includes(attributeType.toUpperCase())) {
            throw new Error(`Invalid attribute type: "${attributeType}"`);
          }
        }
        i = skipWhitespace(xmlData, i);
        let defaultValue = "";
        if (xmlData.substring(i, i + 8).toUpperCase() === "#REQUIRED") {
          defaultValue = "#REQUIRED";
          i += 8;
        } else if (xmlData.substring(i, i + 7).toUpperCase() === "#IMPLIED") {
          defaultValue = "#IMPLIED";
          i += 7;
        } else {
          [i, defaultValue] = this.readIdentifierVal(xmlData, i, "ATTLIST");
        }
        return {
          elementName,
          attributeName,
          attributeType,
          defaultValue,
          index: i
        };
      }
    };
    var skipWhitespace = /* @__PURE__ */ __name((data, index) => {
      while (index < data.length && /\s/.test(data[index])) {
        index++;
      }
      return index;
    }, "skipWhitespace");
    function hasSeq(data, seq, i) {
      for (let j = 0; j < seq.length; j++) {
        if (seq[j] !== data[i + j + 1]) return false;
      }
      return true;
    }
    __name(hasSeq, "hasSeq");
    function validateEntityName(name) {
      if (util.isName(name))
        return name;
      else
        throw new Error(`Invalid entity name ${name}`);
    }
    __name(validateEntityName, "validateEntityName");
    module.exports = DocTypeReader;
  }
});

// ../node_modules/strnum/strnum.js
var require_strnum = __commonJS({
  "../node_modules/strnum/strnum.js"(exports, module) {
    init_functionsRoutes_0_33282656970487656();
    var hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
    var numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
    var consider = {
      hex: true,
      // oct: false,
      leadingZeros: true,
      decimalPoint: ".",
      eNotation: true
      //skipLike: /regex/
    };
    function toNumber(str, options = {}) {
      options = Object.assign({}, consider, options);
      if (!str || typeof str !== "string") return str;
      let trimmedStr = str.trim();
      if (options.skipLike !== void 0 && options.skipLike.test(trimmedStr)) return str;
      else if (str === "0") return 0;
      else if (options.hex && hexRegex.test(trimmedStr)) {
        return parse_int(trimmedStr, 16);
      } else if (trimmedStr.search(/[eE]/) !== -1) {
        const notation = trimmedStr.match(/^([-\+])?(0*)([0-9]*(\.[0-9]*)?[eE][-\+]?[0-9]+)$/);
        if (notation) {
          if (options.leadingZeros) {
            trimmedStr = (notation[1] || "") + notation[3];
          } else {
            if (notation[2] === "0" && notation[3][0] === ".") {
            } else {
              return str;
            }
          }
          return options.eNotation ? Number(trimmedStr) : str;
        } else {
          return str;
        }
      } else {
        const match2 = numRegex.exec(trimmedStr);
        if (match2) {
          const sign2 = match2[1];
          const leadingZeros = match2[2];
          let numTrimmedByZeros = trimZeros(match2[3]);
          if (!options.leadingZeros && leadingZeros.length > 0 && sign2 && trimmedStr[2] !== ".") return str;
          else if (!options.leadingZeros && leadingZeros.length > 0 && !sign2 && trimmedStr[1] !== ".") return str;
          else if (options.leadingZeros && leadingZeros === str) return 0;
          else {
            const num = Number(trimmedStr);
            const numStr = "" + num;
            if (numStr.search(/[eE]/) !== -1) {
              if (options.eNotation) return num;
              else return str;
            } else if (trimmedStr.indexOf(".") !== -1) {
              if (numStr === "0" && numTrimmedByZeros === "") return num;
              else if (numStr === numTrimmedByZeros) return num;
              else if (sign2 && numStr === "-" + numTrimmedByZeros) return num;
              else return str;
            }
            if (leadingZeros) {
              return numTrimmedByZeros === numStr || sign2 + numTrimmedByZeros === numStr ? num : str;
            } else {
              return trimmedStr === numStr || trimmedStr === sign2 + numStr ? num : str;
            }
          }
        } else {
          return str;
        }
      }
    }
    __name(toNumber, "toNumber");
    function trimZeros(numStr) {
      if (numStr && numStr.indexOf(".") !== -1) {
        numStr = numStr.replace(/0+$/, "");
        if (numStr === ".") numStr = "0";
        else if (numStr[0] === ".") numStr = "0" + numStr;
        else if (numStr[numStr.length - 1] === ".") numStr = numStr.substr(0, numStr.length - 1);
        return numStr;
      }
      return numStr;
    }
    __name(trimZeros, "trimZeros");
    function parse_int(numStr, base) {
      if (parseInt) return parseInt(numStr, base);
      else if (Number.parseInt) return Number.parseInt(numStr, base);
      else if (window && window.parseInt) return window.parseInt(numStr, base);
      else throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
    }
    __name(parse_int, "parse_int");
    module.exports = toNumber;
  }
});

// ../node_modules/fast-xml-parser/src/ignoreAttributes.js
var require_ignoreAttributes = __commonJS({
  "../node_modules/fast-xml-parser/src/ignoreAttributes.js"(exports, module) {
    init_functionsRoutes_0_33282656970487656();
    function getIgnoreAttributesFn(ignoreAttributes) {
      if (typeof ignoreAttributes === "function") {
        return ignoreAttributes;
      }
      if (Array.isArray(ignoreAttributes)) {
        return (attrName) => {
          for (const pattern of ignoreAttributes) {
            if (typeof pattern === "string" && attrName === pattern) {
              return true;
            }
            if (pattern instanceof RegExp && pattern.test(attrName)) {
              return true;
            }
          }
        };
      }
      return () => false;
    }
    __name(getIgnoreAttributesFn, "getIgnoreAttributesFn");
    module.exports = getIgnoreAttributesFn;
  }
});

// ../node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
var require_OrderedObjParser = __commonJS({
  "../node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js"(exports, module) {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    var util = require_util();
    var xmlNode = require_xmlNode();
    var DocTypeReader = require_DocTypeReader();
    var toNumber = require_strnum();
    var getIgnoreAttributesFn = require_ignoreAttributes();
    var OrderedObjParser = class {
      static {
        __name(this, "OrderedObjParser");
      }
      constructor(options) {
        this.options = options;
        this.currentNode = null;
        this.tagsNodeStack = [];
        this.docTypeEntities = {};
        this.lastEntities = {
          "apos": { regex: /&(apos|#39|#x27);/g, val: "'" },
          "gt": { regex: /&(gt|#62|#x3E);/g, val: ">" },
          "lt": { regex: /&(lt|#60|#x3C);/g, val: "<" },
          "quot": { regex: /&(quot|#34|#x22);/g, val: '"' }
        };
        this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
        this.htmlEntities = {
          "space": { regex: /&(nbsp|#160);/g, val: " " },
          // "lt" : { regex: /&(lt|#60);/g, val: "<" },
          // "gt" : { regex: /&(gt|#62);/g, val: ">" },
          // "amp" : { regex: /&(amp|#38);/g, val: "&" },
          // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
          // "apos" : { regex: /&(apos|#39);/g, val: "'" },
          "cent": { regex: /&(cent|#162);/g, val: "\xA2" },
          "pound": { regex: /&(pound|#163);/g, val: "\xA3" },
          "yen": { regex: /&(yen|#165);/g, val: "\xA5" },
          "euro": { regex: /&(euro|#8364);/g, val: "\u20AC" },
          "copyright": { regex: /&(copy|#169);/g, val: "\xA9" },
          "reg": { regex: /&(reg|#174);/g, val: "\xAE" },
          "inr": { regex: /&(inr|#8377);/g, val: "\u20B9" },
          "num_dec": { regex: /&#([0-9]{1,7});/g, val: /* @__PURE__ */ __name((_, str) => fromCodePoint(str, 10, "&#"), "val") },
          "num_hex": { regex: /&#x([0-9a-fA-F]{1,6});/g, val: /* @__PURE__ */ __name((_, str) => fromCodePoint(str, 16, "&#x"), "val") }
        };
        this.addExternalEntities = addExternalEntities;
        this.parseXml = parseXml;
        this.parseTextData = parseTextData;
        this.resolveNameSpace = resolveNameSpace;
        this.buildAttributesMap = buildAttributesMap;
        this.isItStopNode = isItStopNode;
        this.replaceEntitiesValue = replaceEntitiesValue;
        this.readStopNodeData = readStopNodeData;
        this.saveTextToParentTag = saveTextToParentTag;
        this.addChild = addChild;
        this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
        this.entityExpansionCount = 0;
        this.currentExpandedLength = 0;
        if (this.options.stopNodes && this.options.stopNodes.length > 0) {
          this.stopNodesExact = /* @__PURE__ */ new Set();
          this.stopNodesWildcard = /* @__PURE__ */ new Set();
          for (let i = 0; i < this.options.stopNodes.length; i++) {
            const stopNodeExp = this.options.stopNodes[i];
            if (typeof stopNodeExp !== "string") continue;
            if (stopNodeExp.startsWith("*.")) {
              this.stopNodesWildcard.add(stopNodeExp.substring(2));
            } else {
              this.stopNodesExact.add(stopNodeExp);
            }
          }
        }
      }
    };
    function addExternalEntities(externalEntities) {
      const entKeys = Object.keys(externalEntities);
      for (let i = 0; i < entKeys.length; i++) {
        const ent = entKeys[i];
        const escaped = ent.replace(/[.\-+*:]/g, "\\.");
        this.lastEntities[ent] = {
          regex: new RegExp("&" + escaped + ";", "g"),
          val: externalEntities[ent]
        };
      }
    }
    __name(addExternalEntities, "addExternalEntities");
    function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
      if (val !== void 0) {
        if (this.options.trimValues && !dontTrim) {
          val = val.trim();
        }
        if (val.length > 0) {
          if (!escapeEntities) val = this.replaceEntitiesValue(val, tagName, jPath);
          const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
          if (newval === null || newval === void 0) {
            return val;
          } else if (typeof newval !== typeof val || newval !== val) {
            return newval;
          } else if (this.options.trimValues) {
            return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
          } else {
            const trimmedVal = val.trim();
            if (trimmedVal === val) {
              return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
            } else {
              return val;
            }
          }
        }
      }
    }
    __name(parseTextData, "parseTextData");
    function resolveNameSpace(tagname) {
      if (this.options.removeNSPrefix) {
        const tags = tagname.split(":");
        const prefix = tagname.charAt(0) === "/" ? "/" : "";
        if (tags[0] === "xmlns") {
          return "";
        }
        if (tags.length === 2) {
          tagname = prefix + tags[1];
        }
      }
      return tagname;
    }
    __name(resolveNameSpace, "resolveNameSpace");
    var attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
    function buildAttributesMap(attrStr, jPath, tagName) {
      if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
        const matches = util.getAllMatches(attrStr, attrsRegx);
        const len = matches.length;
        const attrs = {};
        for (let i = 0; i < len; i++) {
          const attrName = this.resolveNameSpace(matches[i][1]);
          if (this.ignoreAttributesFn(attrName, jPath)) {
            continue;
          }
          let oldVal = matches[i][4];
          let aName = this.options.attributeNamePrefix + attrName;
          if (attrName.length) {
            if (this.options.transformAttributeName) {
              aName = this.options.transformAttributeName(aName);
            }
            aName = sanitizeName(aName, this.options);
            if (oldVal !== void 0) {
              if (this.options.trimValues) {
                oldVal = oldVal.trim();
              }
              oldVal = this.replaceEntitiesValue(oldVal, tagName, jPath);
              const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
              if (newVal === null || newVal === void 0) {
                attrs[aName] = oldVal;
              } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
                attrs[aName] = newVal;
              } else {
                attrs[aName] = parseValue(
                  oldVal,
                  this.options.parseAttributeValue,
                  this.options.numberParseOptions
                );
              }
            } else if (this.options.allowBooleanAttributes) {
              attrs[aName] = true;
            }
          }
        }
        if (!Object.keys(attrs).length) {
          return;
        }
        if (this.options.attributesGroupName) {
          const attrCollection = {};
          attrCollection[this.options.attributesGroupName] = attrs;
          return attrCollection;
        }
        return attrs;
      }
    }
    __name(buildAttributesMap, "buildAttributesMap");
    var parseXml = /* @__PURE__ */ __name(function(xmlData) {
      xmlData = xmlData.replace(/\r\n?/g, "\n");
      const xmlObj = new xmlNode("!xml");
      let currentNode = xmlObj;
      let textData = "";
      let jPath = "";
      this.entityExpansionCount = 0;
      this.currentExpandedLength = 0;
      const docTypeReader = new DocTypeReader(this.options.processEntities);
      for (let i = 0; i < xmlData.length; i++) {
        const ch = xmlData[i];
        if (ch === "<") {
          if (xmlData[i + 1] === "/") {
            const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
            let tagName = xmlData.substring(i + 2, closeIndex).trim();
            if (this.options.removeNSPrefix) {
              const colonIndex = tagName.indexOf(":");
              if (colonIndex !== -1) {
                tagName = tagName.substr(colonIndex + 1);
              }
            }
            if (this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }
            if (currentNode) {
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
            }
            const lastTagName = jPath.substring(jPath.lastIndexOf(".") + 1);
            if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) {
              throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
            }
            let propIndex = 0;
            if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
              propIndex = jPath.lastIndexOf(".", jPath.lastIndexOf(".") - 1);
              this.tagsNodeStack.pop();
            } else {
              propIndex = jPath.lastIndexOf(".");
            }
            jPath = jPath.substring(0, propIndex);
            currentNode = this.tagsNodeStack.pop();
            textData = "";
            i = closeIndex;
          } else if (xmlData[i + 1] === "?") {
            let tagData = readTagExp(xmlData, i, false, "?>");
            if (!tagData) throw new Error("Pi Tag is not closed.");
            textData = this.saveTextToParentTag(textData, currentNode, jPath);
            if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) {
            } else {
              const childNode = new xmlNode(tagData.tagName);
              childNode.add(this.options.textNodeName, "");
              if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
                childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
              }
              this.addChild(currentNode, childNode, jPath, i);
            }
            i = tagData.closeIndex + 1;
          } else if (xmlData.substr(i + 1, 3) === "!--") {
            const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
            if (this.options.commentPropName) {
              const comment = xmlData.substring(i + 4, endIndex - 2);
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
              currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
            }
            i = endIndex;
          } else if (xmlData.substr(i + 1, 2) === "!D") {
            const result = docTypeReader.readDocType(xmlData, i);
            this.docTypeEntities = result.entities;
            i = result.i;
          } else if (xmlData.substr(i + 1, 2) === "![") {
            const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
            const tagExp = xmlData.substring(i + 9, closeIndex);
            textData = this.saveTextToParentTag(textData, currentNode, jPath);
            let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
            if (val == void 0) val = "";
            if (this.options.cdataPropName) {
              currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
            } else {
              currentNode.add(this.options.textNodeName, val);
            }
            i = closeIndex + 2;
          } else {
            let result = readTagExp(xmlData, i, this.options.removeNSPrefix);
            let tagName = result.tagName;
            const rawTagName = result.rawTagName;
            let tagExp = result.tagExp;
            let attrExpPresent = result.attrExpPresent;
            let closeIndex = result.closeIndex;
            if (this.options.transformTagName) {
              const newTagName = this.options.transformTagName(tagName);
              if (tagExp === tagName) {
                tagExp = newTagName;
              }
              tagName = newTagName;
            }
            if (this.options.strictReservedNames && (tagName === this.options.commentPropName || tagName === this.options.cdataPropName || tagName === this.options.textNodeName || tagName === this.options.attributesGroupName)) {
              throw new Error(`Invalid tag name: ${tagName}`);
            }
            if (currentNode && textData) {
              if (currentNode.tagname !== "!xml") {
                textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
              }
            }
            const lastTag = currentNode;
            if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
              currentNode = this.tagsNodeStack.pop();
              jPath = jPath.substring(0, jPath.lastIndexOf("."));
            }
            if (tagName !== xmlObj.tagname) {
              jPath += jPath ? "." + tagName : tagName;
            }
            const startIndex = i;
            if (this.isItStopNode(this.stopNodesExact, this.stopNodesWildcard, jPath, tagName)) {
              let tagContent = "";
              if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
                if (tagName[tagName.length - 1] === "/") {
                  tagName = tagName.substr(0, tagName.length - 1);
                  jPath = jPath.substr(0, jPath.length - 1);
                  tagExp = tagName;
                } else {
                  tagExp = tagExp.substr(0, tagExp.length - 1);
                }
                i = result.closeIndex;
              } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
                i = result.closeIndex;
              } else {
                const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
                if (!result2) throw new Error(`Unexpected end of ${rawTagName}`);
                i = result2.i;
                tagContent = result2.tagContent;
              }
              const childNode = new xmlNode(tagName);
              if (tagName !== tagExp && attrExpPresent) {
                childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
              }
              if (tagContent) {
                tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
              }
              jPath = jPath.substr(0, jPath.lastIndexOf("."));
              childNode.add(this.options.textNodeName, tagContent);
              this.addChild(currentNode, childNode, jPath, startIndex);
            } else {
              if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
                if (tagName[tagName.length - 1] === "/") {
                  tagName = tagName.substr(0, tagName.length - 1);
                  jPath = jPath.substr(0, jPath.length - 1);
                  tagExp = tagName;
                } else {
                  tagExp = tagExp.substr(0, tagExp.length - 1);
                }
                if (this.options.transformTagName) {
                  const newTagName = this.options.transformTagName(tagName);
                  if (tagExp === tagName) {
                    tagExp = newTagName;
                  }
                  tagName = newTagName;
                }
                const childNode = new xmlNode(tagName);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                this.addChild(currentNode, childNode, jPath, startIndex);
                jPath = jPath.substr(0, jPath.lastIndexOf("."));
              } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
                const childNode = new xmlNode(tagName);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath);
                }
                this.addChild(currentNode, childNode, jPath, startIndex);
                jPath = jPath.substr(0, jPath.lastIndexOf("."));
                i = result.closeIndex;
                continue;
              } else {
                const childNode = new xmlNode(tagName);
                if (this.tagsNodeStack.length > this.options.maxNestedTags) {
                  throw new Error("Maximum nested tags exceeded");
                }
                this.tagsNodeStack.push(currentNode);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                this.addChild(currentNode, childNode, jPath);
                currentNode = childNode;
              }
              textData = "";
              i = closeIndex;
            }
          }
        } else {
          textData += xmlData[i];
        }
      }
      return xmlObj.child;
    }, "parseXml");
    function addChild(currentNode, childNode, jPath, startIndex) {
      if (!this.options.captureMetaData) startIndex = void 0;
      const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
      if (result === false) {
      } else if (typeof result === "string") {
        childNode.tagname = result;
        currentNode.addChild(childNode, startIndex);
      } else {
        currentNode.addChild(childNode, startIndex);
      }
    }
    __name(addChild, "addChild");
    var replaceEntitiesValue = /* @__PURE__ */ __name(function(val, tagName, jPath) {
      if (val.indexOf("&") === -1) {
        return val;
      }
      const entityConfig = this.options.processEntities;
      if (!entityConfig.enabled) {
        return val;
      }
      if (entityConfig.allowedTags) {
        if (!entityConfig.allowedTags.includes(tagName)) {
          return val;
        }
      }
      if (entityConfig.tagFilter) {
        if (!entityConfig.tagFilter(tagName, jPath)) {
          return val;
        }
      }
      for (let entityName in this.docTypeEntities) {
        const entity = this.docTypeEntities[entityName];
        const matches = val.match(entity.regx);
        if (matches) {
          this.entityExpansionCount += matches.length;
          if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
            throw new Error(
              `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
            );
          }
          const lengthBefore = val.length;
          val = val.replace(entity.regx, entity.val);
          if (entityConfig.maxExpandedLength) {
            this.currentExpandedLength += val.length - lengthBefore;
            if (this.currentExpandedLength > entityConfig.maxExpandedLength) {
              throw new Error(
                `Total expanded content size exceeded: ${this.currentExpandedLength} > ${entityConfig.maxExpandedLength}`
              );
            }
          }
        }
      }
      if (val.indexOf("&") === -1) return val;
      for (const entityName of Object.keys(this.lastEntities)) {
        const entity = this.lastEntities[entityName];
        const matches = val.match(entity.regex);
        if (matches) {
          this.entityExpansionCount += matches.length;
          if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
            throw new Error(
              `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
            );
          }
        }
        val = val.replace(entity.regex, entity.val);
      }
      if (val.indexOf("&") === -1) return val;
      if (this.options.htmlEntities) {
        for (const entityName of Object.keys(this.htmlEntities)) {
          const entity = this.htmlEntities[entityName];
          const matches = val.match(entity.regex);
          if (matches) {
            this.entityExpansionCount += matches.length;
            if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
              throw new Error(
                `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
              );
            }
          }
          val = val.replace(entity.regex, entity.val);
        }
      }
      val = val.replace(this.ampEntity.regex, this.ampEntity.val);
      return val;
    }, "replaceEntitiesValue");
    function saveTextToParentTag(textData, parentNode, jPath, isLeafNode) {
      if (textData) {
        if (isLeafNode === void 0) isLeafNode = parentNode.child.length === 0;
        textData = this.parseTextData(
          textData,
          parentNode.tagname,
          jPath,
          false,
          parentNode[":@"] ? Object.keys(parentNode[":@"]).length !== 0 : false,
          isLeafNode
        );
        if (textData !== void 0 && textData !== "")
          parentNode.add(this.options.textNodeName, textData);
        textData = "";
      }
      return textData;
    }
    __name(saveTextToParentTag, "saveTextToParentTag");
    function isItStopNode(stopNodesExact, stopNodesWildcard, jPath, currentTagName) {
      if (stopNodesWildcard && stopNodesWildcard.has(currentTagName)) return true;
      if (stopNodesExact && stopNodesExact.has(jPath)) return true;
      return false;
    }
    __name(isItStopNode, "isItStopNode");
    function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
      let attrBoundary;
      let tagExp = "";
      for (let index = i; index < xmlData.length; index++) {
        let ch = xmlData[index];
        if (attrBoundary) {
          if (ch === attrBoundary) attrBoundary = "";
        } else if (ch === '"' || ch === "'") {
          attrBoundary = ch;
        } else if (ch === closingChar[0]) {
          if (closingChar[1]) {
            if (xmlData[index + 1] === closingChar[1]) {
              return {
                data: tagExp,
                index
              };
            }
          } else {
            return {
              data: tagExp,
              index
            };
          }
        } else if (ch === "	") {
          ch = " ";
        }
        tagExp += ch;
      }
    }
    __name(tagExpWithClosingIndex, "tagExpWithClosingIndex");
    function findClosingIndex(xmlData, str, i, errMsg) {
      const closingIndex = xmlData.indexOf(str, i);
      if (closingIndex === -1) {
        throw new Error(errMsg);
      } else {
        return closingIndex + str.length - 1;
      }
    }
    __name(findClosingIndex, "findClosingIndex");
    function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
      const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
      if (!result) return;
      let tagExp = result.data;
      const closeIndex = result.index;
      const separatorIndex = tagExp.search(/\s/);
      let tagName = tagExp;
      let attrExpPresent = true;
      if (separatorIndex !== -1) {
        tagName = tagExp.substring(0, separatorIndex);
        tagExp = tagExp.substring(separatorIndex + 1).trimStart();
      }
      const rawTagName = tagName;
      if (removeNSPrefix) {
        const colonIndex = tagName.indexOf(":");
        if (colonIndex !== -1) {
          tagName = tagName.substr(colonIndex + 1);
          attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
        }
      }
      return {
        tagName,
        tagExp,
        closeIndex,
        attrExpPresent,
        rawTagName
      };
    }
    __name(readTagExp, "readTagExp");
    function readStopNodeData(xmlData, tagName, i) {
      const startIndex = i;
      let openTagCount = 1;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === "<") {
          if (xmlData[i + 1] === "/") {
            const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
            let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
            if (closeTagName === tagName) {
              openTagCount--;
              if (openTagCount === 0) {
                return {
                  tagContent: xmlData.substring(startIndex, i),
                  i: closeIndex
                };
              }
            }
            i = closeIndex;
          } else if (xmlData[i + 1] === "?") {
            const closeIndex = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
            i = closeIndex;
          } else if (xmlData.substr(i + 1, 3) === "!--") {
            const closeIndex = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
            i = closeIndex;
          } else if (xmlData.substr(i + 1, 2) === "![") {
            const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
            i = closeIndex;
          } else {
            const tagData = readTagExp(xmlData, i, ">");
            if (tagData) {
              const openTagName = tagData && tagData.tagName;
              if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
                openTagCount++;
              }
              i = tagData.closeIndex;
            }
          }
        }
      }
    }
    __name(readStopNodeData, "readStopNodeData");
    function parseValue(val, shouldParse, options) {
      if (shouldParse && typeof val === "string") {
        const newval = val.trim();
        if (newval === "true") return true;
        else if (newval === "false") return false;
        else return toNumber(val, options);
      } else {
        if (util.isExist(val)) {
          return val;
        } else {
          return "";
        }
      }
    }
    __name(parseValue, "parseValue");
    function fromCodePoint(str, base, prefix) {
      const codePoint = Number.parseInt(str, base);
      if (codePoint >= 0 && codePoint <= 1114111) {
        return String.fromCodePoint(codePoint);
      } else {
        return prefix + str + ";";
      }
    }
    __name(fromCodePoint, "fromCodePoint");
    function sanitizeName(name, options) {
      if (util.criticalProperties.includes(name)) {
        throw new Error(`[SECURITY] Invalid name: "${name}" is a reserved JavaScript keyword that could cause prototype pollution`);
      } else if (util.DANGEROUS_PROPERTY_NAMES.includes(name)) {
        return options.onDangerousProperty(name);
      }
      return name;
    }
    __name(sanitizeName, "sanitizeName");
    module.exports = OrderedObjParser;
  }
});

// ../node_modules/fast-xml-parser/src/xmlparser/node2json.js
var require_node2json = __commonJS({
  "../node_modules/fast-xml-parser/src/xmlparser/node2json.js"(exports) {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    function prettify(node, options) {
      return compress(node, options);
    }
    __name(prettify, "prettify");
    function compress(arr, options, jPath) {
      let text;
      const compressedObj = {};
      for (let i = 0; i < arr.length; i++) {
        const tagObj = arr[i];
        const property = propName(tagObj);
        let newJpath = "";
        if (jPath === void 0) newJpath = property;
        else newJpath = jPath + "." + property;
        if (property === options.textNodeName) {
          if (text === void 0) text = tagObj[property];
          else text += "" + tagObj[property];
        } else if (property === void 0) {
          continue;
        } else if (tagObj[property]) {
          let val = compress(tagObj[property], options, newJpath);
          const isLeaf = isLeafTag(val, options);
          if (tagObj[":@"]) {
            assignAttributes(val, tagObj[":@"], newJpath, options);
          } else if (Object.keys(val).length === 1 && val[options.textNodeName] !== void 0 && !options.alwaysCreateTextNode) {
            val = val[options.textNodeName];
          } else if (Object.keys(val).length === 0) {
            if (options.alwaysCreateTextNode) val[options.textNodeName] = "";
            else val = "";
          }
          if (compressedObj[property] !== void 0 && compressedObj.hasOwnProperty(property)) {
            if (!Array.isArray(compressedObj[property])) {
              compressedObj[property] = [compressedObj[property]];
            }
            compressedObj[property].push(val);
          } else {
            if (options.isArray(property, newJpath, isLeaf)) {
              compressedObj[property] = [val];
            } else {
              compressedObj[property] = val;
            }
          }
        }
      }
      if (typeof text === "string") {
        if (text.length > 0) compressedObj[options.textNodeName] = text;
      } else if (text !== void 0) compressedObj[options.textNodeName] = text;
      return compressedObj;
    }
    __name(compress, "compress");
    function propName(obj) {
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key !== ":@") return key;
      }
    }
    __name(propName, "propName");
    function assignAttributes(obj, attrMap, jpath, options) {
      if (attrMap) {
        const keys = Object.keys(attrMap);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
          const atrrName = keys[i];
          if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
            obj[atrrName] = [attrMap[atrrName]];
          } else {
            obj[atrrName] = attrMap[atrrName];
          }
        }
      }
    }
    __name(assignAttributes, "assignAttributes");
    function isLeafTag(obj, options) {
      const { textNodeName } = options;
      const propCount = Object.keys(obj).length;
      if (propCount === 0) {
        return true;
      }
      if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
        return true;
      }
      return false;
    }
    __name(isLeafTag, "isLeafTag");
    exports.prettify = prettify;
  }
});

// ../node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
var require_XMLParser = __commonJS({
  "../node_modules/fast-xml-parser/src/xmlparser/XMLParser.js"(exports, module) {
    init_functionsRoutes_0_33282656970487656();
    var { buildOptions } = require_OptionsBuilder();
    var OrderedObjParser = require_OrderedObjParser();
    var { prettify } = require_node2json();
    var validator = require_validator();
    var XMLParser2 = class {
      static {
        __name(this, "XMLParser");
      }
      constructor(options) {
        this.externalEntities = {};
        this.options = buildOptions(options);
      }
      /**
       * Parse XML dats to JS object 
       * @param {string|Buffer} xmlData 
       * @param {boolean|Object} validationOption 
       */
      parse(xmlData, validationOption) {
        if (typeof xmlData === "string") {
        } else if (xmlData.toString) {
          xmlData = xmlData.toString();
        } else {
          throw new Error("XML data is accepted in String or Bytes[] form.");
        }
        if (validationOption) {
          if (validationOption === true) validationOption = {};
          const result = validator.validate(xmlData, validationOption);
          if (result !== true) {
            throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
          }
        }
        const orderedObjParser = new OrderedObjParser(this.options);
        orderedObjParser.addExternalEntities(this.externalEntities);
        const orderedResult = orderedObjParser.parseXml(xmlData);
        if (this.options.preserveOrder || orderedResult === void 0) return orderedResult;
        else return prettify(orderedResult, this.options);
      }
      /**
       * Add Entity which is not by default supported by this library
       * @param {string} key 
       * @param {string} value 
       */
      addEntity(key, value) {
        if (value.indexOf("&") !== -1) {
          throw new Error("Entity value can't have '&'");
        } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
          throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
        } else if (value === "&") {
          throw new Error("An entity with value '&' is not permitted");
        } else {
          this.externalEntities[key] = value;
        }
      }
    };
    module.exports = XMLParser2;
  }
});

// ../node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js
var require_orderedJs2Xml = __commonJS({
  "../node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js"(exports, module) {
    init_functionsRoutes_0_33282656970487656();
    var EOL = "\n";
    function toXml(jArray, options) {
      let indentation = "";
      if (options.format && options.indentBy.length > 0) {
        indentation = EOL;
      }
      return arrToStr(jArray, options, "", indentation);
    }
    __name(toXml, "toXml");
    function arrToStr(arr, options, jPath, indentation) {
      let xmlStr = "";
      let isPreviousElementTag = false;
      if (!Array.isArray(arr)) {
        if (arr !== void 0 && arr !== null) {
          let text = arr.toString();
          text = replaceEntitiesValue(text, options);
          return text;
        }
        return "";
      }
      for (let i = 0; i < arr.length; i++) {
        const tagObj = arr[i];
        const tagName = propName(tagObj);
        if (tagName === void 0) continue;
        let newJPath = "";
        if (jPath.length === 0) newJPath = tagName;
        else newJPath = `${jPath}.${tagName}`;
        if (tagName === options.textNodeName) {
          let tagText = tagObj[tagName];
          if (!isStopNode(newJPath, options)) {
            tagText = options.tagValueProcessor(tagName, tagText);
            tagText = replaceEntitiesValue(tagText, options);
          }
          if (isPreviousElementTag) {
            xmlStr += indentation;
          }
          xmlStr += tagText;
          isPreviousElementTag = false;
          continue;
        } else if (tagName === options.cdataPropName) {
          if (isPreviousElementTag) {
            xmlStr += indentation;
          }
          const cdataVal = String(tagObj[tagName][0][options.textNodeName]).replace(/\]\]>/g, "]]]]><![CDATA[>");
          xmlStr += `<![CDATA[${cdataVal}]]>`;
          isPreviousElementTag = false;
          continue;
        } else if (tagName === options.commentPropName) {
          const commentVal = String(tagObj[tagName][0][options.textNodeName]).replace(/--/g, "- -").replace(/-$/, "- ");
          xmlStr += indentation + `<!--${commentVal}-->`;
          isPreviousElementTag = true;
          continue;
        } else if (tagName[0] === "?") {
          const attStr2 = attr_to_str(tagObj[":@"], options);
          const tempInd = tagName === "?xml" ? "" : indentation;
          let piTextNodeName = tagObj[tagName][0][options.textNodeName];
          piTextNodeName = piTextNodeName.length !== 0 ? " " + piTextNodeName : "";
          xmlStr += tempInd + `<${tagName}${piTextNodeName}${attStr2}?>`;
          isPreviousElementTag = true;
          continue;
        }
        let newIdentation = indentation;
        if (newIdentation !== "") {
          newIdentation += options.indentBy;
        }
        const attStr = attr_to_str(tagObj[":@"], options);
        const tagStart = indentation + `<${tagName}${attStr}`;
        const tagValue = arrToStr(tagObj[tagName], options, newJPath, newIdentation);
        if (options.unpairedTags.indexOf(tagName) !== -1) {
          if (options.suppressUnpairedNode) xmlStr += tagStart + ">";
          else xmlStr += tagStart + "/>";
        } else if ((!tagValue || tagValue.length === 0) && options.suppressEmptyNode) {
          xmlStr += tagStart + "/>";
        } else if (tagValue && tagValue.endsWith(">")) {
          xmlStr += tagStart + `>${tagValue}${indentation}</${tagName}>`;
        } else {
          xmlStr += tagStart + ">";
          if (tagValue && indentation !== "" && (tagValue.includes("/>") || tagValue.includes("</"))) {
            xmlStr += indentation + options.indentBy + tagValue + indentation;
          } else {
            xmlStr += tagValue;
          }
          xmlStr += `</${tagName}>`;
        }
        isPreviousElementTag = true;
      }
      return xmlStr;
    }
    __name(arrToStr, "arrToStr");
    function propName(obj) {
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        if (key !== ":@") return key;
      }
    }
    __name(propName, "propName");
    function attr_to_str(attrMap, options) {
      let attrStr = "";
      if (attrMap && !options.ignoreAttributes) {
        for (let attr in attrMap) {
          if (!Object.prototype.hasOwnProperty.call(attrMap, attr)) continue;
          let attrVal = options.attributeValueProcessor(attr, attrMap[attr]);
          attrVal = replaceEntitiesValue(attrVal, options);
          if (attrVal === true && options.suppressBooleanAttributes) {
            attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
          } else {
            attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
          }
        }
      }
      return attrStr;
    }
    __name(attr_to_str, "attr_to_str");
    function isStopNode(jPath, options) {
      jPath = jPath.substr(0, jPath.length - options.textNodeName.length - 1);
      let tagName = jPath.substr(jPath.lastIndexOf(".") + 1);
      for (let index in options.stopNodes) {
        if (options.stopNodes[index] === jPath || options.stopNodes[index] === "*." + tagName) return true;
      }
      return false;
    }
    __name(isStopNode, "isStopNode");
    function replaceEntitiesValue(textValue, options) {
      if (textValue && textValue.length > 0 && options.processEntities) {
        for (let i = 0; i < options.entities.length; i++) {
          const entity = options.entities[i];
          textValue = textValue.replace(entity.regex, entity.val);
        }
      }
      return textValue;
    }
    __name(replaceEntitiesValue, "replaceEntitiesValue");
    module.exports = toXml;
  }
});

// ../node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js
var require_json2xml = __commonJS({
  "../node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js"(exports, module) {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    var buildFromOrderedJs = require_orderedJs2Xml();
    var getIgnoreAttributesFn = require_ignoreAttributes();
    var defaultOptions = {
      attributeNamePrefix: "@_",
      attributesGroupName: false,
      textNodeName: "#text",
      ignoreAttributes: true,
      cdataPropName: false,
      format: false,
      indentBy: "  ",
      suppressEmptyNode: false,
      suppressUnpairedNode: true,
      suppressBooleanAttributes: true,
      tagValueProcessor: /* @__PURE__ */ __name(function(key, a) {
        return a;
      }, "tagValueProcessor"),
      attributeValueProcessor: /* @__PURE__ */ __name(function(attrName, a) {
        return a;
      }, "attributeValueProcessor"),
      preserveOrder: false,
      commentPropName: false,
      unpairedTags: [],
      entities: [
        { regex: new RegExp("&", "g"), val: "&amp;" },
        //it must be on top
        { regex: new RegExp(">", "g"), val: "&gt;" },
        { regex: new RegExp("<", "g"), val: "&lt;" },
        { regex: new RegExp("'", "g"), val: "&apos;" },
        { regex: new RegExp('"', "g"), val: "&quot;" }
      ],
      processEntities: true,
      stopNodes: [],
      // transformTagName: false,
      // transformAttributeName: false,
      oneListGroup: false
    };
    function Builder(options) {
      this.options = Object.assign({}, defaultOptions, options);
      if (this.options.ignoreAttributes === true || this.options.attributesGroupName) {
        this.isAttribute = function() {
          return false;
        };
      } else {
        this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
        this.attrPrefixLen = this.options.attributeNamePrefix.length;
        this.isAttribute = isAttribute;
      }
      this.processTextOrObjNode = processTextOrObjNode;
      if (this.options.format) {
        this.indentate = indentate;
        this.tagEndChar = ">\n";
        this.newLine = "\n";
      } else {
        this.indentate = function() {
          return "";
        };
        this.tagEndChar = ">";
        this.newLine = "";
      }
    }
    __name(Builder, "Builder");
    Builder.prototype.build = function(jObj) {
      if (this.options.preserveOrder) {
        return buildFromOrderedJs(jObj, this.options);
      } else {
        if (Array.isArray(jObj) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1) {
          jObj = {
            [this.options.arrayNodeName]: jObj
          };
        }
        return this.j2x(jObj, 0, []).val;
      }
    };
    Builder.prototype.j2x = function(jObj, level, ajPath) {
      let attrStr = "";
      let val = "";
      const jPath = ajPath.join(".");
      for (let key in jObj) {
        if (!Object.prototype.hasOwnProperty.call(jObj, key)) continue;
        if (typeof jObj[key] === "undefined") {
          if (this.isAttribute(key)) {
            val += "";
          }
        } else if (jObj[key] === null) {
          if (this.isAttribute(key)) {
            val += "";
          } else if (key === this.options.cdataPropName) {
            val += "";
          } else if (key[0] === "?") {
            val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
          } else {
            val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
          }
        } else if (jObj[key] instanceof Date) {
          val += this.buildTextValNode(jObj[key], key, "", level);
        } else if (typeof jObj[key] !== "object") {
          const attr = this.isAttribute(key);
          if (attr && !this.ignoreAttributesFn(attr, jPath)) {
            attrStr += this.buildAttrPairStr(attr, "" + jObj[key]);
          } else if (!attr) {
            if (key === this.options.textNodeName) {
              let newval = this.options.tagValueProcessor(key, "" + jObj[key]);
              val += this.replaceEntitiesValue(newval);
            } else {
              val += this.buildTextValNode(jObj[key], key, "", level);
            }
          }
        } else if (Array.isArray(jObj[key])) {
          const arrLen = jObj[key].length;
          let listTagVal = "";
          let listTagAttr = "";
          for (let j = 0; j < arrLen; j++) {
            const item = jObj[key][j];
            if (typeof item === "undefined") {
            } else if (item === null) {
              if (key[0] === "?") val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
              else val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
            } else if (typeof item === "object") {
              if (this.options.oneListGroup) {
                const result = this.j2x(item, level + 1, ajPath.concat(key));
                listTagVal += result.val;
                if (this.options.attributesGroupName && item.hasOwnProperty(this.options.attributesGroupName)) {
                  listTagAttr += result.attrStr;
                }
              } else {
                listTagVal += this.processTextOrObjNode(item, key, level, ajPath);
              }
            } else {
              if (this.options.oneListGroup) {
                let textValue = this.options.tagValueProcessor(key, item);
                textValue = this.replaceEntitiesValue(textValue);
                listTagVal += textValue;
              } else {
                listTagVal += this.buildTextValNode(item, key, "", level);
              }
            }
          }
          if (this.options.oneListGroup) {
            listTagVal = this.buildObjectNode(listTagVal, key, listTagAttr, level);
          }
          val += listTagVal;
        } else {
          if (this.options.attributesGroupName && key === this.options.attributesGroupName) {
            const Ks = Object.keys(jObj[key]);
            const L = Ks.length;
            for (let j = 0; j < L; j++) {
              attrStr += this.buildAttrPairStr(Ks[j], "" + jObj[key][Ks[j]]);
            }
          } else {
            val += this.processTextOrObjNode(jObj[key], key, level, ajPath);
          }
        }
      }
      return { attrStr, val };
    };
    Builder.prototype.buildAttrPairStr = function(attrName, val) {
      val = this.options.attributeValueProcessor(attrName, "" + val);
      val = this.replaceEntitiesValue(val);
      if (this.options.suppressBooleanAttributes && val === "true") {
        return " " + attrName;
      } else return " " + attrName + '="' + val + '"';
    };
    function processTextOrObjNode(object, key, level, ajPath) {
      const result = this.j2x(object, level + 1, ajPath.concat(key));
      if (object[this.options.textNodeName] !== void 0 && Object.keys(object).length === 1) {
        return this.buildTextValNode(object[this.options.textNodeName], key, result.attrStr, level);
      } else {
        return this.buildObjectNode(result.val, key, result.attrStr, level);
      }
    }
    __name(processTextOrObjNode, "processTextOrObjNode");
    Builder.prototype.buildObjectNode = function(val, key, attrStr, level) {
      if (val === "") {
        if (key[0] === "?") return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
        else {
          return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
        }
      } else {
        let tagEndExp = "</" + key + this.tagEndChar;
        let piClosingChar = "";
        if (key[0] === "?") {
          piClosingChar = "?";
          tagEndExp = "";
        }
        if ((attrStr || attrStr === "") && val.indexOf("<") === -1) {
          return this.indentate(level) + "<" + key + attrStr + piClosingChar + ">" + val + tagEndExp;
        } else if (this.options.commentPropName !== false && key === this.options.commentPropName && piClosingChar.length === 0) {
          const safeVal = String(val).replace(/--/g, "- -").replace(/-$/, "- ");
          return this.indentate(level) + `<!--${safeVal}-->` + this.newLine;
        } else {
          return this.indentate(level) + "<" + key + attrStr + piClosingChar + this.tagEndChar + val + this.indentate(level) + tagEndExp;
        }
      }
    };
    Builder.prototype.closeTag = function(key) {
      let closeTag = "";
      if (this.options.unpairedTags.indexOf(key) !== -1) {
        if (!this.options.suppressUnpairedNode) closeTag = "/";
      } else if (this.options.suppressEmptyNode) {
        closeTag = "/";
      } else {
        closeTag = `></${key}`;
      }
      return closeTag;
    };
    Builder.prototype.buildTextValNode = function(val, key, attrStr, level) {
      if (this.options.cdataPropName !== false && key === this.options.cdataPropName) {
        const safeVal = String(val).replace(/\]\]>/g, "]]]]><![CDATA[>");
        return this.indentate(level) + `<![CDATA[${safeVal}]]>` + this.newLine;
      } else if (this.options.commentPropName !== false && key === this.options.commentPropName) {
        const safeVal = String(val).replace(/--/g, "- -").replace(/-$/, "- ");
        return this.indentate(level) + `<!--${safeVal}-->` + this.newLine;
      } else if (key[0] === "?") {
        return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
      } else {
        let textValue = this.options.tagValueProcessor(key, val);
        textValue = this.replaceEntitiesValue(textValue);
        if (textValue === "") {
          return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
        } else {
          return this.indentate(level) + "<" + key + attrStr + ">" + textValue + "</" + key + this.tagEndChar;
        }
      }
    };
    Builder.prototype.replaceEntitiesValue = function(textValue) {
      if (textValue && textValue.length > 0 && this.options.processEntities) {
        for (let i = 0; i < this.options.entities.length; i++) {
          const entity = this.options.entities[i];
          textValue = textValue.replace(entity.regex, entity.val);
        }
      }
      return textValue;
    };
    function indentate(level) {
      return this.options.indentBy.repeat(level);
    }
    __name(indentate, "indentate");
    function isAttribute(name) {
      if (name.startsWith(this.options.attributeNamePrefix) && name !== this.options.textNodeName) {
        return name.substr(this.attrPrefixLen);
      } else {
        return false;
      }
    }
    __name(isAttribute, "isAttribute");
    module.exports = Builder;
  }
});

// ../node_modules/fast-xml-parser/src/fxp.js
var require_fxp = __commonJS({
  "../node_modules/fast-xml-parser/src/fxp.js"(exports, module) {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    var validator = require_validator();
    var XMLParser2 = require_XMLParser();
    var XMLBuilder = require_json2xml();
    module.exports = {
      XMLParser: XMLParser2,
      XMLValidator: validator,
      XMLBuilder
    };
  }
});

// ../src/drive/paths.ts
function normalizePrefix(input) {
  if (input == null || input === "") {
    return "";
  }
  const relative = normalizeRelativePath(String(input), { allowTrailingSlash: true, allowEmpty: true });
  return relative && !relative.endsWith("/") ? `${relative}/` : relative;
}
function normalizeFileName(input) {
  if (typeof input !== "string") {
    throw new PathValidationError("\u6587\u4EF6\u540D\u4E0D\u80FD\u4E3A\u7A7A");
  }
  const name = input.trim();
  validateSegment(name);
  if (name.includes("/") || name.includes("\\")) {
    throw new PathValidationError("\u6587\u4EF6\u540D\u4E0D\u80FD\u5305\u542B\u8DEF\u5F84\u5206\u9694\u7B26");
  }
  return name;
}
function normalizeRelativeFilePath(input) {
  if (typeof input !== "string") {
    throw new PathValidationError("\u6587\u4EF6\u8DEF\u5F84\u4E0D\u80FD\u4E3A\u7A7A");
  }
  return normalizeStrictRelativeFilePath(input);
}
function normalizeFolderName(input) {
  return normalizeFileName(input);
}
function normalizeObjectPath(input, options = {}) {
  if (typeof input !== "string") {
    throw new PathValidationError("\u6587\u4EF6\u8DEF\u5F84\u4E0D\u80FD\u4E3A\u7A7A");
  }
  return normalizeRelativePath(input, { allowTrailingSlash: Boolean(options.allowTrailingSlash), allowEmpty: false });
}
function makeObjectKey(rootPrefix, relativePath) {
  return `${rootPrefix}${relativePath}`;
}
function trimRootPrefix(rootPrefix, key) {
  return rootPrefix && key.startsWith(rootPrefix) ? key.slice(rootPrefix.length) : key;
}
function normalizeRelativePath(input, options) {
  const raw = input.trim().replace(/\\/g, "/");
  if (CONTROL_CHARS2.test(raw)) {
    throw new PathValidationError("\u8DEF\u5F84\u5305\u542B\u975E\u6CD5\u63A7\u5236\u5B57\u7B26");
  }
  if (raw.startsWith("/")) {
    throw new PathValidationError("\u8DEF\u5F84\u4E0D\u80FD\u4EE5 / \u5F00\u5934");
  }
  if (raw.length > MAX_RELATIVE_PATH_LENGTH) {
    throw new PathValidationError("\u8DEF\u5F84\u8FC7\u957F");
  }
  const wantsTrailingSlash = raw.endsWith("/");
  const segments = raw.split("/").filter(Boolean);
  if (!segments.length) {
    if (options.allowEmpty) {
      return "";
    }
    throw new PathValidationError("\u6587\u4EF6\u8DEF\u5F84\u4E0D\u80FD\u4E3A\u7A7A");
  }
  for (const segment of segments) {
    validateSegment(segment);
  }
  const normalized = segments.join("/");
  if (wantsTrailingSlash) {
    if (!options.allowTrailingSlash) {
      throw new PathValidationError("\u6587\u4EF6\u8DEF\u5F84\u4E0D\u80FD\u4EE5 / \u7ED3\u5C3E");
    }
    return `${normalized}/`;
  }
  return normalized;
}
function normalizeStrictRelativeFilePath(input) {
  const raw = input.trim().replace(/\\/g, "/");
  if (CONTROL_CHARS2.test(raw)) {
    throw new PathValidationError("\u8DEF\u5F84\u5305\u542B\u975E\u6CD5\u63A7\u5236\u5B57\u7B26");
  }
  if (raw.startsWith("/")) {
    throw new PathValidationError("\u8DEF\u5F84\u4E0D\u80FD\u4EE5 / \u5F00\u5934");
  }
  if (raw.endsWith("/")) {
    throw new PathValidationError("\u6587\u4EF6\u8DEF\u5F84\u4E0D\u80FD\u4EE5 / \u7ED3\u5C3E");
  }
  if (raw.length > MAX_RELATIVE_PATH_LENGTH) {
    throw new PathValidationError("\u8DEF\u5F84\u8FC7\u957F");
  }
  const segments = raw.split("/");
  if (!segments.length || segments.some((segment) => !segment)) {
    throw new PathValidationError("\u8DEF\u5F84\u4E0D\u80FD\u5305\u542B\u7A7A\u7247\u6BB5");
  }
  for (const segment of segments) {
    validateSegment(segment);
  }
  return segments.join("/");
}
function validateSegment(segment) {
  if (!segment || segment === "." || segment === "..") {
    throw new PathValidationError("\u8DEF\u5F84\u4E0D\u80FD\u5305\u542B . \u6216 ..");
  }
  if (segment.length > MAX_SEGMENT_LENGTH) {
    throw new PathValidationError("\u8DEF\u5F84\u7247\u6BB5\u8FC7\u957F");
  }
  if (CONTROL_CHARS2.test(segment)) {
    throw new PathValidationError("\u8DEF\u5F84\u5305\u542B\u975E\u6CD5\u63A7\u5236\u5B57\u7B26");
  }
}
var CONTROL_CHARS2, MAX_SEGMENT_LENGTH, MAX_RELATIVE_PATH_LENGTH, PathValidationError;
var init_paths = __esm({
  "../src/drive/paths.ts"() {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    CONTROL_CHARS2 = /[\u0000-\u001f\u007f]/;
    MAX_SEGMENT_LENGTH = 180;
    MAX_RELATIVE_PATH_LENGTH = 900;
    PathValidationError = class extends Error {
      static {
        __name(this, "PathValidationError");
      }
      constructor(message) {
        super(message);
        this.name = "PathValidationError";
      }
    };
    __name(normalizePrefix, "normalizePrefix");
    __name(normalizeFileName, "normalizeFileName");
    __name(normalizeRelativeFilePath, "normalizeRelativeFilePath");
    __name(normalizeFolderName, "normalizeFolderName");
    __name(normalizeObjectPath, "normalizeObjectPath");
    __name(makeObjectKey, "makeObjectKey");
    __name(trimRootPrefix, "trimRootPrefix");
    __name(normalizeRelativePath, "normalizeRelativePath");
    __name(normalizeStrictRelativeFilePath, "normalizeStrictRelativeFilePath");
    __name(validateSegment, "validateSegment");
  }
});

// ../src/drive/cos.ts
async function listObjects(config, prefix, cursor) {
  const cosPrefix = makeObjectKey(config.rootPrefix, prefix);
  const url = new URL(config.endpoint);
  url.searchParams.set("list-type", "2");
  url.searchParams.set("delimiter", "/");
  url.searchParams.set("prefix", cosPrefix);
  url.searchParams.set("max-keys", "1000");
  if (cursor) {
    url.searchParams.set("continuation-token", cursor);
  }
  const response = await signedFetch(config, url.toString(), { method: "GET" });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`COS \u5217\u8868\u8BF7\u6C42\u5931\u8D25: ${response.status}`);
  }
  return parseListObjectsXml(text, config.rootPrefix, prefix);
}
async function listObjectPaths(config, prefix, cursor) {
  const cosPrefix = makeObjectKey(config.rootPrefix, prefix);
  const url = new URL(config.endpoint);
  url.searchParams.set("list-type", "2");
  url.searchParams.set("prefix", cosPrefix);
  url.searchParams.set("max-keys", "1000");
  if (cursor) {
    url.searchParams.set("continuation-token", cursor);
  }
  const response = await signedFetch(config, url.toString(), { method: "GET" });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`COS \u5217\u8868\u8BF7\u6C42\u5931\u8D25: ${response.status}`);
  }
  return parseObjectPathsXml(text, config.rootPrefix);
}
async function createFolder(config, relativeFolderPath) {
  const key = makeObjectKey(config.rootPrefix, relativeFolderPath);
  const response = await signedFetch(config, objectUrl(config, key), {
    method: "PUT",
    headers: {
      "content-type": "application/x-directory"
    },
    body: ""
  });
  if (!response.ok) {
    throw new Error(`COS \u6587\u4EF6\u5939\u521B\u5EFA\u5931\u8D25: ${response.status}`);
  }
}
async function putObjectText(config, relativePath, text, contentType = "text/plain; charset=utf-8") {
  const key = makeObjectKey(config.rootPrefix, relativePath);
  const response = await signedFetch(config, objectUrl(config, key), {
    method: "PUT",
    headers: {
      "content-type": contentType
    },
    body: text
  });
  if (!response.ok) {
    throw new Error(`COS \u5199\u5165\u8BF7\u6C42\u5931\u8D25: ${response.status}`);
  }
}
async function getObjectText(config, relativePath) {
  const key = makeObjectKey(config.rootPrefix, relativePath);
  const response = await signedFetch(config, objectUrl(config, key), { method: "GET" });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`COS \u8BFB\u53D6\u8BF7\u6C42\u5931\u8D25: ${response.status}`);
  }
  return response.text();
}
async function deleteObject(config, relativePath) {
  const key = makeObjectKey(config.rootPrefix, relativePath);
  const response = await signedFetch(config, objectUrl(config, key), { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new Error(`COS \u5220\u9664\u8BF7\u6C42\u5931\u8D25: ${response.status}`);
  }
}
async function deleteObjects(config, relativePaths) {
  const chunkSize = 20;
  for (let index = 0; index < relativePaths.length; index += chunkSize) {
    await Promise.all(relativePaths.slice(index, index + chunkSize).map((path) => deleteObject(config, path)));
  }
}
async function presignObjectUrl(config, method, relativePath, headers = {}) {
  const key = makeObjectKey(config.rootPrefix, relativePath);
  const client = createClient(config);
  const url = new URL(objectUrl(config, key));
  url.searchParams.set("X-Amz-Expires", String(config.signExpiresSeconds));
  const signedRequest = await client.sign(url.toString(), {
    method,
    headers,
    aws: {
      signQuery: true
    }
  });
  return signedRequest.url;
}
function parseListObjectsXml(xml, rootPrefix, currentPrefix) {
  const parsed = parser.parse(xml);
  const result = parsed.ListBucketResult ?? {};
  const folders = toArray(result.CommonPrefixes).map((entry) => String(entry.Prefix ?? "")).filter(Boolean).map((key) => trimRootPrefix(rootPrefix, key)).filter((path) => path.startsWith(currentPrefix) && path !== currentPrefix).map((path) => {
    const name = path.slice(currentPrefix.length).replace(/\/$/, "");
    return { name, path };
  }).filter((folder) => folder.name && !folder.name.includes("/") && !isSystemFile(folder.name));
  const files = toArray(result.Contents).map((entry) => ({
    key: String(entry.Key ?? ""),
    size: Number(entry.Size ?? 0),
    lastModified: String(entry.LastModified ?? ""),
    etag: String(entry.ETag ?? "").replace(/^"|"$/g, "")
  })).filter((entry) => entry.key && entry.key !== makeObjectKey(rootPrefix, currentPrefix) && !entry.key.endsWith("/")).map((entry) => {
    const path = trimRootPrefix(rootPrefix, entry.key);
    const name = path.slice(currentPrefix.length);
    return {
      name,
      path,
      size: entry.size,
      lastModified: entry.lastModified,
      etag: entry.etag
    };
  }).filter((file) => file.name && !file.name.includes("/") && !isSystemFile(file.name));
  const nextCursor = result.NextContinuationToken ? String(result.NextContinuationToken) : null;
  return { prefix: currentPrefix, folders, files, nextCursor };
}
function parseObjectPathsXml(xml, rootPrefix) {
  const parsed = parser.parse(xml);
  const result = parsed.ListBucketResult ?? {};
  const paths = toArray(result.Contents).map((entry) => String(entry.Key ?? "")).filter(Boolean).map((key) => trimRootPrefix(rootPrefix, key));
  const nextCursor = result.NextContinuationToken ? String(result.NextContinuationToken) : null;
  return { paths, nextCursor };
}
function isSystemFile(name) {
  return name.startsWith("._");
}
function createClient(config) {
  return new AwsClient({
    accessKeyId: config.cosSecretId,
    secretAccessKey: config.cosSecretKey,
    region: config.region,
    service: "s3"
  });
}
async function signedFetch(config, input, init) {
  const client = createClient(config);
  const request = await client.sign(input, init);
  return fetch(request);
}
function objectUrl(config, key) {
  const encodedPath = key.split("/").map(encodeURIComponent).join("/");
  return `${config.endpoint}/${encodedPath}`;
}
function toArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
var import_fast_xml_parser, parser;
var init_cos = __esm({
  "../src/drive/cos.ts"() {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    init_aws4fetch_esm();
    import_fast_xml_parser = __toESM(require_fxp(), 1);
    init_paths();
    parser = new import_fast_xml_parser.XMLParser({
      ignoreAttributes: false,
      parseTagValue: true,
      trimValues: true
    });
    __name(listObjects, "listObjects");
    __name(listObjectPaths, "listObjectPaths");
    __name(createFolder, "createFolder");
    __name(putObjectText, "putObjectText");
    __name(getObjectText, "getObjectText");
    __name(deleteObject, "deleteObject");
    __name(deleteObjects, "deleteObjects");
    __name(presignObjectUrl, "presignObjectUrl");
    __name(parseListObjectsXml, "parseListObjectsXml");
    __name(parseObjectPathsXml, "parseObjectPathsXml");
    __name(isSystemFile, "isSystemFile");
    __name(createClient, "createClient");
    __name(signedFetch, "signedFetch");
    __name(objectUrl, "objectUrl");
    __name(toArray, "toArray");
  }
});

// ../src/drive/topic.ts
function normalizeTopicName(input) {
  return normalizeFolderName(input);
}
function topicPrefixFromName(name) {
  return `${normalizeTopicName(name)}/`;
}
function normalizeTopicPrefix(input) {
  const prefix = normalizePrefix(input);
  const segments = prefix.split("/").filter(Boolean);
  if (segments.length !== 1) {
    throw new Error("\u4E13\u9898\u8DEF\u5F84\u65E0\u6548");
  }
  return prefix;
}
function isSystemFileName(name) {
  return name.startsWith("._");
}
function hasSystemPathSegment(path) {
  return path.split("/").some(isSystemFileName);
}
async function createTopic(config, input) {
  const name = normalizeTopicName(input.name);
  const prefix = topicPrefixFromName(name);
  const description = normalizeDescription(input.description);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const topic = {
    version: 1,
    name,
    prefix,
    description,
    createdBy: input.displayName,
    createdAt: now,
    updatedBy: input.displayName,
    updatedAt: now
  };
  const prompts = createDefaultPrompts({ origin: input.origin, name, prefix, description });
  const existing = await getObjectText(config, `${prefix}${TOPIC_META_FILENAME}`);
  if (existing) {
    throw new Error("\u540C\u540D\u4E13\u9898\u5DF2\u5B58\u5728");
  }
  await createFolder(config, prefix);
  await createFolder(config, `${prefix}${OUTPUTS_FOLDER_NAME}/`);
  await putObjectText(config, `${prefix}${TOPIC_META_FILENAME}`, JSON.stringify(topic, null, 2), "application/json; charset=utf-8");
  await putObjectText(config, `${prefix}${GENERATE_PROMPT_FILENAME}`, prompts.generatePrompt, "text/markdown; charset=utf-8");
  await writeDriveMeta(config, prefix, {
    version: 1,
    files: {
      [GENERATE_PROMPT_FILENAME]: fileMetadata(input.displayName, prompts.generatePrompt, "text/markdown; charset=utf-8", "prompt", now),
      [TOPIC_META_FILENAME]: fileMetadata(input.displayName, JSON.stringify(topic), "application/json; charset=utf-8", "topic", now)
    }
  });
  await writeDriveMeta(config, `${prefix}${OUTPUTS_FOLDER_NAME}/`, { version: 1, files: {} });
  return {
    topic,
    generatePrompt: prompts.generatePrompt,
    outputs: []
  };
}
async function readTopic(config, rawPrefix, options) {
  const prefix = normalizeTopicPrefix(rawPrefix);
  const { topic, generatePrompt } = await ensureTopicScaffold(config, prefix, options);
  const outputs = await listDirectoryWithMetadata(config, `${prefix}${OUTPUTS_FOLDER_NAME}/`);
  return { topic, generatePrompt, outputs: outputs.files };
}
async function updateTopic(config, input) {
  const prefix = normalizeTopicPrefix(input.prefix);
  const { topic, generatePrompt: existingGeneratePrompt } = await ensureTopicScaffold(config, prefix, {
    displayName: input.displayName,
    origin: input.origin
  });
  const description = input.description == null ? topic.description : normalizeDescription(input.description);
  const generatePrompt = input.generatePrompt == null ? existingGeneratePrompt : normalizePrompt(input.generatePrompt);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const updatedTopic = {
    ...topic,
    description,
    updatedBy: input.displayName,
    updatedAt: now
  };
  await putObjectText(config, `${prefix}${TOPIC_META_FILENAME}`, JSON.stringify(updatedTopic, null, 2), "application/json; charset=utf-8");
  await putObjectText(config, `${prefix}${GENERATE_PROMPT_FILENAME}`, generatePrompt, "text/markdown; charset=utf-8");
  await recordFileMetadata(
    config,
    `${prefix}${TOPIC_META_FILENAME}`,
    fileMetadata(input.displayName, JSON.stringify(updatedTopic), "application/json; charset=utf-8", "topic", now)
  );
  await recordFileMetadata(config, `${prefix}${GENERATE_PROMPT_FILENAME}`, {
    uploadedBy: input.displayName,
    uploadedAt: now,
    contentType: "text/markdown; charset=utf-8",
    size: byteLength(generatePrompt),
    kind: "prompt"
  });
  const outputs = await listDirectoryWithMetadata(config, `${prefix}${OUTPUTS_FOLDER_NAME}/`);
  return { topic: updatedTopic, generatePrompt, outputs: outputs.files };
}
async function deleteTopic(config, input) {
  const prefix = normalizeTopicPrefix(input.prefix);
  const { topic } = await ensureTopicScaffold(config, prefix, {
    displayName: input.displayName,
    origin: input.origin
  });
  if (typeof input.confirmName !== "string" || input.confirmName.trim() !== topic.name) {
    throw new Error("\u4E13\u9898\u540D\u79F0\u786E\u8BA4\u4E0D\u4E00\u81F4");
  }
  const paths = await listAllObjectPaths(config, prefix);
  await deleteObjects(config, paths);
  return {
    ok: true,
    prefix,
    name: topic.name,
    deletedCount: paths.length
  };
}
async function listDirectoryWithMetadata(config, prefix, cursor) {
  const result = await listObjects(config, prefix, cursor);
  const meta = await readDriveMeta(config, prefix);
  return mergeListMetadata(result, meta);
}
function mergeListMetadata(result, meta) {
  return {
    ...result,
    files: result.files.map((file) => {
      const entry = meta.files[file.name];
      return entry ? {
        ...file,
        uploadedBy: entry.uploadedBy,
        uploadedAt: entry.uploadedAt,
        contentType: entry.contentType,
        kind: entry.kind
      } : file;
    })
  };
}
async function recordUploadComplete(config, input) {
  const path = normalizeObjectPath(input.path);
  if (isSystemFileName(fileNameFromPath(path))) {
    throw new Error("\u4E0D\u80FD\u767B\u8BB0\u7CFB\u7EDF\u6587\u4EF6");
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const meta = {
    uploadedBy: input.displayName,
    uploadedAt: now,
    contentType: normalizeContentType(input.contentType),
    size: normalizeSize(input.size),
    kind: normalizeUploadKind(input.kind, path)
  };
  await recordFileMetadata(config, path, meta);
  return { ...meta, path, name: fileNameFromPath(path) };
}
async function removeFileMetadata(config, rawPath) {
  const path = normalizeObjectPath(rawPath);
  const prefix = directoryPrefixFromPath(path);
  const name = fileNameFromPath(path);
  const meta = await readDriveMeta(config, prefix);
  if (!meta.files[name]) {
    return;
  }
  delete meta.files[name];
  await writeDriveMeta(config, prefix, meta);
}
async function createAgentManifest(config, input) {
  const prefix = normalizeTopicPrefix(input.prefix);
  const { topic } = await ensureTopicScaffold(config, prefix, {
    displayName: input.displayName,
    origin: input.origin
  });
  const generatedAt = /* @__PURE__ */ new Date();
  const expiresAt = new Date(generatedAt.getTime() + config.signExpiresSeconds * 1e3);
  const materialFiles = await listTopicMaterialFiles(config, prefix);
  const files = await Promise.all(
    materialFiles.map(async (file) => ({
      path: file.path,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      uploadedBy: file.uploadedBy,
      contentType: file.contentType,
      signedUrl: await presignObjectUrl(config, "GET", file.path)
    }))
  );
  const manifest = {
    version: 1,
    topic: {
      name: topic.name,
      prefix: topic.prefix,
      description: topic.description
    },
    generatedAt: generatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    expiresIn: config.signExpiresSeconds,
    files,
    instructions: [
      "\u4E0D\u9700\u8981\u767B\u5F55\uFF0C\u4E0D\u9700\u8981 cookie\u3002",
      "\u5148\u4E0B\u8F7D\u672C manifest JSON\uFF0C\u518D\u9010\u4E2A\u8BFB\u53D6 files[].signedUrl\u3002",
      "\u4FDD\u7559\u6BCF\u6761\u7ED3\u8BBA\u7684\u6765\u6E90 path\u3001\u6587\u4EF6\u540D\u3001\u4F5C\u8005\u6216\u673A\u6784\u3001\u53D1\u5E03\u65E5\u671F\u548C\u5173\u952E\u6570\u636E\u3002",
      "\u8DF3\u8FC7 outputs/\u3001\u7CFB\u7EDF\u9690\u85CF\u6587\u4EF6\u548C\u63D0\u793A\u8BCD\u6587\u4EF6\u3002",
      "\u94FE\u63A5\u8FC7\u671F\u540E\u56DE\u5230\u4E13\u9898\u8D44\u6599\u5E93\u91CD\u65B0\u751F\u6210 agent \u5206\u6790\u63D0\u793A\u8BCD\u3002"
    ]
  };
  const manifestPath = `${prefix}${AGENT_MANIFEST_FOLDER_NAME}/${compactTimestamp(generatedAt)}-${createNonce()}.json`;
  await putObjectText(config, manifestPath, JSON.stringify(manifest, null, 2), "application/json; charset=utf-8");
  const manifestUrl = await presignObjectUrl(config, "GET", manifestPath);
  return {
    prompt: createAgentManifestPrompt({
      topic,
      generatedAt: manifest.generatedAt,
      expiresAt: manifest.expiresAt,
      expiresIn: manifest.expiresIn,
      fileCount: files.length,
      manifestUrl
    }),
    manifestUrl,
    manifestPath,
    expiresIn: config.signExpiresSeconds,
    generatedAt: manifest.generatedAt,
    fileCount: files.length
  };
}
function createAgentManifestPrompt(input) {
  return `# ${input.topic.name}\uFF1AAgent \u8D44\u6599\u5206\u6790\u4EFB\u52A1

\u4F60\u662F\u672C\u5730 AI agent\u3002\u4F60\u4E0D\u9700\u8981\u767B\u5F55\u7F51\u76D8\uFF0C\u4E5F\u4E0D\u9700\u8981\u643A\u5E26 cookie\u3002

\u8BF7\u5148\u4E0B\u8F7D\u8FD9\u4E00\u4E2A manifest JSON\uFF1A
${input.manifestUrl}

\u94FE\u63A5\u4FE1\u606F\uFF1A
- \u4E13\u9898\u8DEF\u5F84\uFF1A${input.topic.prefix}
- \u4E13\u9898\u8BF4\u660E\uFF1A${input.topic.description || "\u6682\u65E0\u4E13\u9898\u8BF4\u660E\u3002"}
- \u751F\u6210\u65F6\u95F4\uFF1A${input.generatedAt}
- \u8FC7\u671F\u65F6\u95F4\uFF1A${input.expiresAt}
- \u6709\u6548\u671F\uFF1A${input.expiresIn} \u79D2
- \u8D44\u6599\u6570\u91CF\uFF1A${input.fileCount}

\u8BFB\u53D6\u65B9\u6CD5\uFF1A
1. \u4E0B\u8F7D manifest JSON\u3002
2. \u904D\u5386 manifest.files\uFF0C\u4F7F\u7528\u6BCF\u4E2A\u6587\u4EF6\u7684 signedUrl \u4E0B\u8F7D\u8D44\u6599\u3002
3. \u5206\u6790 PDF\u3001HTML\u3001Markdown\u3001Word\u3001Excel\u3001PPT\u3001\u56FE\u7247\u7B49\u8D44\u6599\uFF1B\u65E0\u6CD5\u89E3\u6790\u65F6\u8BB0\u5F55\u539F\u56E0\u548C\u6587\u4EF6 path\u3002
4. \u8F93\u51FA\u8D44\u6599\u7D22\u5F15\u548C\u7ED3\u6784\u5316\u5206\u6790\uFF0C\u81F3\u5C11\u5305\u542B\uFF1A\u6765\u6E90 path\u3001\u8D44\u6599\u7C7B\u578B\u3001\u4F5C\u8005\u6216\u673A\u6784\u3001\u53D1\u5E03\u65E5\u671F\u3001\u6838\u5FC3\u89C2\u70B9\u3001\u5173\u952E\u6570\u636E\u3001\u5F85\u6838\u9A8C\u95EE\u9898\u3002
5. \u6BCF\u4E2A\u91CD\u8981\u5224\u65AD\u5FC5\u987B\u6807\u6CE8\u6765\u6E90 path\u3002\u94FE\u63A5\u8FC7\u671F\u540E\u505C\u6B62\u8BFB\u53D6\uFF0C\u5E76\u63D0\u793A\u7528\u6237\u91CD\u65B0\u751F\u6210 agent \u5206\u6790\u63D0\u793A\u8BCD\u3002
`;
}
async function listTopicMaterialFiles(config, topicPrefix) {
  const files = [];
  const pending = [topicPrefix];
  while (pending.length) {
    const currentPrefix = pending.shift();
    const listing = await listAllDirectoryWithMetadata(config, currentPrefix);
    for (const folder of listing.folders) {
      if (isAgentReadableFolder(topicPrefix, folder.path)) {
        pending.push(folder.path);
      }
    }
    for (const file of listing.files) {
      if (isAgentReadableFile(topicPrefix, file)) {
        files.push(file);
      }
    }
  }
  return files;
}
async function listAllDirectoryWithMetadata(config, prefix) {
  const folders = /* @__PURE__ */ new Map();
  const files = [];
  let cursor = null;
  do {
    const result = await listDirectoryWithMetadata(config, prefix, cursor);
    for (const folder of result.folders) {
      folders.set(folder.path, folder);
    }
    files.push(...result.files);
    cursor = result.nextCursor;
  } while (cursor);
  return {
    prefix,
    folders: Array.from(folders.values()),
    files,
    nextCursor: null
  };
}
async function listAllObjectPaths(config, prefix) {
  const paths = [];
  let cursor = null;
  do {
    const result = await listObjectPaths(config, prefix, cursor);
    paths.push(...result.paths);
    cursor = result.nextCursor;
  } while (cursor);
  return paths;
}
function isAgentReadableFolder(topicPrefix, folderPath) {
  return folderPath !== `${topicPrefix}${OUTPUTS_FOLDER_NAME}/` && !hasSystemPathSegment(folderPath);
}
function isAgentReadableFile(topicPrefix, file) {
  return !file.path.startsWith(`${topicPrefix}${OUTPUTS_FOLDER_NAME}/`) && !hasSystemPathSegment(file.path) && file.name !== GENERATE_PROMPT_FILENAME;
}
function createDefaultPrompts(input) {
  const description = input.description || "\u6682\u65E0\u4E13\u9898\u8BF4\u660E\u3002";
  const generatePrompt = `# ${input.name}\uFF1A\u6210\u679C\u751F\u6210\u4E0E\u56DE\u4F20

\u4F60\u662F\u672C\u5730 AI agent\u3002\u8BF7\u57FA\u4E8E\u4E13\u9898 \`${input.prefix}\` \u7684\u8D44\u6599\u751F\u6210\u7ED3\u6784\u5316\u6210\u679C\uFF0C\u5E76\u56DE\u4F20 HTML/PDF/Markdown \u5230 \`${input.prefix}${OUTPUTS_FOLDER_NAME}/\`\u3002

\u4E13\u9898\u8BF4\u660E\uFF1A
${description}

\u63A8\u8350\u6D41\u7A0B\uFF1A
1. \u8D44\u6599\u5206\u5C42\uFF1A\u533A\u5206\u4E8B\u5B9E\u3001\u89C2\u70B9\u3001\u9884\u6D4B\u3001\u6570\u636E\u3001\u98CE\u9669\u63D0\u793A\u3002
2. \u8BC1\u636E\u5F52\u7EB3\uFF1A\u6BCF\u4E2A\u91CD\u8981\u5224\u65AD\u5FC5\u987B\u6807\u6CE8\u6765\u6E90\u6587\u4EF6\u540D\uFF1B\u51B2\u7A81\u89C2\u70B9\u5E76\u5217\u5448\u73B0\u3002
3. \u7ED3\u6784\u5316\u8F93\u51FA\uFF1A\u5148\u7ED9\u6458\u8981\uFF0C\u518D\u7ED9\u5206\u6790\u6846\u67B6\u3001\u5173\u952E\u53D1\u73B0\u3001\u6570\u636E\u8868\u3001\u98CE\u9669\u4E0E\u5F85\u529E\u3002
4. \u56FA\u5B9A\u4EA7\u7269\uFF1A\u751F\u6210 Markdown \u539F\u7A3F\u3001\u53EF\u76F4\u63A5\u9884\u89C8\u7684 HTML\uFF0C\u4EE5\u53CA\u9700\u8981\u5F52\u6863\u65F6\u7684 PDF\u3002
5. \u547D\u540D\u89C4\u5219\uFF1A\`outputs/YYYY-MM-DD-${input.name}-\u4E13\u9898\u603B\u7ED3.md\`\u3001\`outputs/YYYY-MM-DD-${input.name}-\u4E13\u9898\u603B\u7ED3.html\`\u3001\`outputs/YYYY-MM-DD-${input.name}-\u4E13\u9898\u603B\u7ED3.pdf\`\u3002

\u56DE\u4F20\u6D41\u7A0B\uFF1A
1. \u8C03\u7528 \`${input.origin}/api/drive/upload-url\`\uFF0Cbody \u5305\u542B \`prefix: "${input.prefix}${OUTPUTS_FOLDER_NAME}/"\`\u3001\`filename\`\u3001\`size\`\u3001\`contentType\`\u3002
2. \u7528\u8FD4\u56DE\u7684\u77ED\u65F6 PUT URL \u4E0A\u4F20\u6587\u4EF6\u3002
3. \u4E0A\u4F20\u6210\u529F\u540E\u8C03\u7528 \`${input.origin}/api/drive/upload-complete\`\uFF0Cbody \u5305\u542B \`path\`\u3001\`size\`\u3001\`contentType\`\u3001\`kind: "output"\`\u3002
4. \u56DE\u4F20\u5B8C\u6210\u540E\uFF0C\u786E\u8BA4\u4E13\u9898\u6210\u679C\u533A\u80FD\u9884\u89C8 HTML/PDF/Markdown\u3002
`;
  return { generatePrompt };
}
async function ensureTopicScaffold(config, prefix, options) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let topic = await readTopicMetadataIfExists(config, prefix);
  if (!topic) {
    const name = topicNameFromPrefix(prefix);
    topic = {
      version: 1,
      name,
      prefix,
      description: "",
      createdBy: options.displayName,
      createdAt: now,
      updatedBy: options.displayName,
      updatedAt: now
    };
    await putObjectText(config, `${prefix}${TOPIC_META_FILENAME}`, JSON.stringify(topic, null, 2), "application/json; charset=utf-8");
  }
  const defaultPrompts = createDefaultPrompts({
    origin: options.origin,
    name: topic.name,
    prefix,
    description: topic.description
  });
  let generatePrompt = await getObjectText(config, `${prefix}${GENERATE_PROMPT_FILENAME}`);
  if (generatePrompt === null) {
    generatePrompt = defaultPrompts.generatePrompt;
    await putObjectText(config, `${prefix}${GENERATE_PROMPT_FILENAME}`, generatePrompt, "text/markdown; charset=utf-8");
  }
  const outputsPrefix = `${prefix}${OUTPUTS_FOLDER_NAME}/`;
  const outputsMarker = await getObjectText(config, outputsPrefix);
  if (outputsMarker === null) {
    await createFolder(config, outputsPrefix);
  }
  const rootMeta = await readDriveMeta(config, prefix);
  let rootMetaChanged = false;
  if (!rootMeta.files[TOPIC_META_FILENAME]) {
    rootMeta.files[TOPIC_META_FILENAME] = fileMetadata(
      options.displayName,
      JSON.stringify(topic),
      "application/json; charset=utf-8",
      "topic",
      now
    );
    rootMetaChanged = true;
  }
  if (!rootMeta.files[GENERATE_PROMPT_FILENAME]) {
    rootMeta.files[GENERATE_PROMPT_FILENAME] = fileMetadata(
      options.displayName,
      generatePrompt,
      "text/markdown; charset=utf-8",
      "prompt",
      now
    );
    rootMetaChanged = true;
  }
  if (rootMetaChanged) {
    await writeDriveMeta(config, prefix, rootMeta);
  }
  const outputsMetaPath = `${outputsPrefix}${DRIVE_META_FILENAME}`;
  const outputsMeta = await getObjectText(config, outputsMetaPath);
  if (outputsMeta === null) {
    await writeDriveMeta(config, outputsPrefix, { version: 1, files: {} });
  }
  return { topic, generatePrompt };
}
async function readTopicMetadataIfExists(config, prefix) {
  const text = await getObjectText(config, `${prefix}${TOPIC_META_FILENAME}`);
  if (!text) {
    return null;
  }
  const parsed = JSON.parse(text);
  if (parsed.version !== 1 || typeof parsed.name !== "string" || typeof parsed.prefix !== "string") {
    throw new Error("\u4E13\u9898\u5143\u6570\u636E\u65E0\u6548");
  }
  return {
    version: 1,
    name: parsed.name,
    prefix,
    description: typeof parsed.description === "string" ? parsed.description : "",
    createdBy: typeof parsed.createdBy === "string" ? parsed.createdBy : "-",
    createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : "",
    updatedBy: typeof parsed.updatedBy === "string" ? parsed.updatedBy : "-",
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : ""
  };
}
function topicNameFromPrefix(prefix) {
  return prefix.replace(/\/$/, "");
}
async function recordFileMetadata(config, path, fileMeta) {
  const prefix = directoryPrefixFromPath(path);
  const name = fileNameFromPath(path);
  const meta = await readDriveMeta(config, prefix);
  meta.files[name] = fileMeta;
  await writeDriveMeta(config, prefix, meta);
}
async function readDriveMeta(config, prefix) {
  const text = await getObjectText(config, `${prefix}${DRIVE_META_FILENAME}`);
  if (!text) {
    return { version: 1, files: {} };
  }
  try {
    const parsed = JSON.parse(text);
    return parsed.version === 1 && parsed.files && typeof parsed.files === "object" ? { version: 1, files: parsed.files } : { version: 1, files: {} };
  } catch {
    return { version: 1, files: {} };
  }
}
async function writeDriveMeta(config, prefix, meta) {
  await putObjectText(config, `${prefix}${DRIVE_META_FILENAME}`, JSON.stringify(meta, null, 2), "application/json; charset=utf-8");
}
function fileMetadata(displayName, text, contentType, kind, uploadedAt) {
  return {
    uploadedBy: displayName,
    uploadedAt,
    contentType,
    size: byteLength(text),
    kind
  };
}
function normalizeDescription(input) {
  if (input == null) {
    return "";
  }
  if (typeof input !== "string") {
    throw new Error("\u4E13\u9898\u8BF4\u660E\u65E0\u6548");
  }
  if (input.length > 3e3) {
    throw new Error("\u4E13\u9898\u8BF4\u660E\u8FC7\u957F");
  }
  return input.trim();
}
function normalizePrompt(input) {
  if (typeof input !== "string") {
    throw new Error("\u63D0\u793A\u8BCD\u5185\u5BB9\u65E0\u6548");
  }
  if (input.length > 12e4) {
    throw new Error("\u63D0\u793A\u8BCD\u5185\u5BB9\u8FC7\u957F");
  }
  return input;
}
function normalizeContentType(input) {
  if (typeof input !== "string" || !input.trim()) {
    return "application/octet-stream";
  }
  const value = input.trim();
  if (value.length > 160 || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error("contentType \u65E0\u6548");
  }
  return value;
}
function normalizeSize(input) {
  const size = typeof input === "number" ? input : Number(input ?? 0);
  return Number.isFinite(size) && size >= 0 ? Math.round(size) : 0;
}
function normalizeUploadKind(input, path) {
  if (input === "output" || path.includes(`/${OUTPUTS_FOLDER_NAME}/`)) {
    return "output";
  }
  if (input === "prompt") {
    return "prompt";
  }
  return "material";
}
function directoryPrefixFromPath(path) {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index + 1);
}
function fileNameFromPath(path) {
  const index = path.lastIndexOf("/");
  return index === -1 ? path : path.slice(index + 1);
}
function byteLength(value) {
  return new TextEncoder().encode(value).length;
}
function compactTimestamp(value) {
  return value.toISOString().replace(/[-:.]/g, "").replace("T", "-").replace("Z", "Z");
}
function createNonce() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
var DRIVE_META_FILENAME, TOPIC_META_FILENAME, GENERATE_PROMPT_FILENAME, OUTPUTS_FOLDER_NAME, AGENT_MANIFEST_FOLDER_NAME;
var init_topic = __esm({
  "../src/drive/topic.ts"() {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    init_cos();
    init_paths();
    DRIVE_META_FILENAME = "._drive-meta.json";
    TOPIC_META_FILENAME = "._topic.json";
    GENERATE_PROMPT_FILENAME = "\u6210\u679C\u751F\u6210\u4E0E\u56DE\u4F20.prompt.md";
    OUTPUTS_FOLDER_NAME = "outputs";
    AGENT_MANIFEST_FOLDER_NAME = "._agent-manifests";
    __name(normalizeTopicName, "normalizeTopicName");
    __name(topicPrefixFromName, "topicPrefixFromName");
    __name(normalizeTopicPrefix, "normalizeTopicPrefix");
    __name(isSystemFileName, "isSystemFileName");
    __name(hasSystemPathSegment, "hasSystemPathSegment");
    __name(createTopic, "createTopic");
    __name(readTopic, "readTopic");
    __name(updateTopic, "updateTopic");
    __name(deleteTopic, "deleteTopic");
    __name(listDirectoryWithMetadata, "listDirectoryWithMetadata");
    __name(mergeListMetadata, "mergeListMetadata");
    __name(recordUploadComplete, "recordUploadComplete");
    __name(removeFileMetadata, "removeFileMetadata");
    __name(createAgentManifest, "createAgentManifest");
    __name(createAgentManifestPrompt, "createAgentManifestPrompt");
    __name(listTopicMaterialFiles, "listTopicMaterialFiles");
    __name(listAllDirectoryWithMetadata, "listAllDirectoryWithMetadata");
    __name(listAllObjectPaths, "listAllObjectPaths");
    __name(isAgentReadableFolder, "isAgentReadableFolder");
    __name(isAgentReadableFile, "isAgentReadableFile");
    __name(createDefaultPrompts, "createDefaultPrompts");
    __name(ensureTopicScaffold, "ensureTopicScaffold");
    __name(readTopicMetadataIfExists, "readTopicMetadataIfExists");
    __name(topicNameFromPrefix, "topicNameFromPrefix");
    __name(recordFileMetadata, "recordFileMetadata");
    __name(readDriveMeta, "readDriveMeta");
    __name(writeDriveMeta, "writeDriveMeta");
    __name(fileMetadata, "fileMetadata");
    __name(normalizeDescription, "normalizeDescription");
    __name(normalizePrompt, "normalizePrompt");
    __name(normalizeContentType, "normalizeContentType");
    __name(normalizeSize, "normalizeSize");
    __name(normalizeUploadKind, "normalizeUploadKind");
    __name(directoryPrefixFromPath, "directoryPrefixFromPath");
    __name(fileNameFromPath, "fileNameFromPath");
    __name(byteLength, "byteLength");
    __name(compactTimestamp, "compactTimestamp");
    __name(createNonce, "createNonce");
  }
});

// api/drive/agent-manifest.ts
var onRequestPost;
var init_agent_manifest = __esm({
  "api/drive/agent-manifest.ts"() {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    init_config();
    init_http();
    init_topic();
    onRequestPost = /* @__PURE__ */ __name(async ({ request, env }) => {
      try {
        const session = await readDriveSession({ request, env });
        if (session instanceof Response) {
          return session;
        }
        const body = await readJsonBody(request);
        const result = await createAgentManifest(getDriveConfig(env), {
          prefix: body.prefix,
          displayName: session.displayName,
          origin: new URL(request.url).origin
        });
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }, "onRequestPost");
  }
});

// api/drive/download-url.ts
var onRequestPost2;
var init_download_url = __esm({
  "api/drive/download-url.ts"() {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    init_config();
    init_cos();
    init_http();
    init_paths();
    init_topic();
    onRequestPost2 = /* @__PURE__ */ __name(async ({ request, env }) => {
      try {
        const unauthorized = await requireDriveSession({ request, env });
        if (unauthorized) {
          return unauthorized;
        }
        const body = await readJsonBody(request);
        const path = normalizeObjectPath(body.path);
        if (hasSystemPathSegment(path)) {
          return jsonResponse({ error: "\u4E0D\u80FD\u4E0B\u8F7D\u7CFB\u7EDF\u6587\u4EF6" }, 400);
        }
        const url = await presignObjectUrl(getDriveConfig(env), "GET", path);
        return jsonResponse({ url, path });
      } catch (error) {
        return errorResponse(error);
      }
    }, "onRequestPost");
  }
});

// api/drive/folder.ts
var onRequestPost3;
var init_folder = __esm({
  "api/drive/folder.ts"() {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    init_config();
    init_cos();
    init_http();
    init_paths();
    onRequestPost3 = /* @__PURE__ */ __name(async ({ request, env }) => {
      try {
        const unauthorized = await requireDriveSession({ request, env });
        if (unauthorized) {
          return unauthorized;
        }
        const body = await readJsonBody(request);
        const prefix = normalizePrefix(body.prefix ?? "");
        const name = normalizeFolderName(body.name);
        const path = `${prefix}${name}/`;
        await createFolder(getDriveConfig(env), path);
        return jsonResponse({ ok: true, path });
      } catch (error) {
        return errorResponse(error);
      }
    }, "onRequestPost");
  }
});

// api/drive/list.ts
var onRequestGet;
var init_list = __esm({
  "api/drive/list.ts"() {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    init_config();
    init_http();
    init_paths();
    init_topic();
    onRequestGet = /* @__PURE__ */ __name(async ({ request, env }) => {
      try {
        const unauthorized = await requireDriveSession({ request, env });
        if (unauthorized) {
          return unauthorized;
        }
        const url = new URL(request.url);
        const prefix = normalizePrefix(url.searchParams.get("prefix") ?? "");
        const cursor = url.searchParams.get("cursor");
        const result = await listDirectoryWithMetadata(getDriveConfig(env), prefix, cursor);
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }, "onRequestGet");
  }
});

// api/drive/login.ts
var onRequestPost4;
var init_login = __esm({
  "api/drive/login.ts"() {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    init_http();
    init_session();
    onRequestPost4 = /* @__PURE__ */ __name(async ({ request, env }) => {
      try {
        const body = await readJsonBody(request);
        const ok = await verifyAccessCode(env, body.accessCode);
        if (!ok) {
          return jsonResponse({ error: "\u8BBF\u95EE\u7801\u4E0D\u6B63\u786E" }, 401);
        }
        const displayName = normalizeDisplayName(body.displayName);
        const cookie = await createSessionCookie(env, request.url, displayName);
        return jsonResponse({ ok: true, displayName }, 200, { "set-cookie": cookie });
      } catch (error) {
        return errorResponse(error);
      }
    }, "onRequestPost");
  }
});

// api/drive/logout.ts
var onRequestPost5;
var init_logout = __esm({
  "api/drive/logout.ts"() {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    init_http();
    init_session();
    onRequestPost5 = /* @__PURE__ */ __name(async ({ request }) => {
      return jsonResponse({ ok: true }, 200, { "set-cookie": clearSessionCookie(request.url) });
    }, "onRequestPost");
  }
});

// api/drive/object.ts
var onRequestDelete;
var init_object = __esm({
  "api/drive/object.ts"() {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    init_config();
    init_cos();
    init_http();
    init_paths();
    init_topic();
    onRequestDelete = /* @__PURE__ */ __name(async ({ request, env }) => {
      try {
        const unauthorized = await requireDriveSession({ request, env });
        if (unauthorized) {
          return unauthorized;
        }
        const body = await readJsonBody(request);
        const path = normalizeObjectPath(body.path, { allowTrailingSlash: true });
        const config = getDriveConfig(env);
        if (hasSystemPathSegment(path)) {
          return jsonResponse({ error: "\u4E0D\u80FD\u5220\u9664\u7CFB\u7EDF\u6587\u4EF6" }, 400);
        }
        await deleteObject(config, path);
        if (!path.endsWith("/")) {
          await removeFileMetadata(config, path);
        }
        return jsonResponse({ ok: true, path });
      } catch (error) {
        return errorResponse(error);
      }
    }, "onRequestDelete");
  }
});

// api/drive/topic.ts
var onRequestGet2, onRequestPost6, onRequestPut, onRequestDelete2;
var init_topic2 = __esm({
  "api/drive/topic.ts"() {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    init_config();
    init_http();
    init_topic();
    onRequestGet2 = /* @__PURE__ */ __name(async ({ request, env }) => {
      try {
        const session = await readDriveSession({ request, env });
        if (session instanceof Response) {
          return session;
        }
        const url = new URL(request.url);
        const detail = await readTopic(getDriveConfig(env), url.searchParams.get("prefix"), {
          displayName: session.displayName,
          origin: url.origin
        });
        return jsonResponse(detail);
      } catch (error) {
        return errorResponse(error);
      }
    }, "onRequestGet");
    onRequestPost6 = /* @__PURE__ */ __name(async ({ request, env }) => {
      try {
        const session = await readDriveSession({ request, env });
        if (session instanceof Response) {
          return session;
        }
        const body = await readJsonBody(request);
        const detail = await createTopic(getDriveConfig(env), {
          name: body.name,
          description: body.description,
          displayName: session.displayName,
          origin: new URL(request.url).origin
        });
        return jsonResponse(detail);
      } catch (error) {
        return errorResponse(error);
      }
    }, "onRequestPost");
    onRequestPut = /* @__PURE__ */ __name(async ({ request, env }) => {
      try {
        const session = await readDriveSession({ request, env });
        if (session instanceof Response) {
          return session;
        }
        const body = await readJsonBody(request);
        const detail = await updateTopic(getDriveConfig(env), {
          prefix: body.prefix,
          description: body.description,
          generatePrompt: body.generatePrompt,
          displayName: session.displayName,
          origin: new URL(request.url).origin
        });
        return jsonResponse(detail);
      } catch (error) {
        return errorResponse(error);
      }
    }, "onRequestPut");
    onRequestDelete2 = /* @__PURE__ */ __name(async ({ request, env }) => {
      try {
        const session = await readDriveSession({ request, env });
        if (session instanceof Response) {
          return session;
        }
        const body = await readJsonBody(request);
        const result = await deleteTopic(getDriveConfig(env), {
          prefix: body.prefix,
          confirmName: body.confirmName,
          displayName: session.displayName,
          origin: new URL(request.url).origin
        });
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }, "onRequestDelete");
  }
});

// api/drive/upload-complete.ts
var onRequestPost7;
var init_upload_complete = __esm({
  "api/drive/upload-complete.ts"() {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    init_config();
    init_http();
    init_topic();
    onRequestPost7 = /* @__PURE__ */ __name(async ({ request, env }) => {
      try {
        const session = await readDriveSession({ request, env });
        if (session instanceof Response) {
          return session;
        }
        const body = await readJsonBody(request);
        const file = await recordUploadComplete(getDriveConfig(env), {
          path: body.path,
          size: body.size,
          contentType: body.contentType,
          kind: body.kind,
          displayName: session.displayName
        });
        return jsonResponse({ ok: true, file });
      } catch (error) {
        return errorResponse(error);
      }
    }, "onRequestPost");
  }
});

// api/drive/upload-url.ts
function normalizeUploadPath(relativePath, filename) {
  if (typeof relativePath === "string" && relativePath.trim()) {
    return normalizeRelativeFilePath(relativePath);
  }
  return normalizeFileName(filename);
}
var onRequestPost8;
var init_upload_url = __esm({
  "api/drive/upload-url.ts"() {
    "use strict";
    init_functionsRoutes_0_33282656970487656();
    init_config();
    init_cos();
    init_http();
    init_paths();
    init_topic();
    onRequestPost8 = /* @__PURE__ */ __name(async ({ request, env }) => {
      try {
        const unauthorized = await requireDriveSession({ request, env });
        if (unauthorized) {
          return unauthorized;
        }
        const body = await readJsonBody(request);
        const config = getDriveConfig(env);
        const prefix = normalizePrefix(body.prefix ?? "");
        const relativePath = normalizeUploadPath(body.relativePath, body.filename);
        if (hasSystemPathSegment(relativePath)) {
          return jsonResponse({ error: "\u4E0D\u80FD\u4E0A\u4F20\u7CFB\u7EDF\u6587\u4EF6\u540D" }, 400);
        }
        const size = typeof body.size === "number" ? body.size : Number(body.size ?? 0);
        if (!Number.isFinite(size) || size <= 0) {
          return jsonResponse({ error: "\u6587\u4EF6\u5927\u5C0F\u65E0\u6548" }, 400);
        }
        if (size > config.maxFileBytes) {
          return jsonResponse({ error: "\u6587\u4EF6\u8D85\u8FC7\u4E0A\u4F20\u5927\u5C0F\u9650\u5236" }, 413);
        }
        const contentType = typeof body.contentType === "string" && body.contentType ? body.contentType : "application/octet-stream";
        const path = `${prefix}${relativePath}`;
        const url = await presignObjectUrl(config, "PUT", path, { "content-type": contentType });
        return jsonResponse({
          url,
          path,
          contentType,
          expiresIn: config.signExpiresSeconds,
          maxFileBytes: config.maxFileBytes
        });
      } catch (error) {
        return errorResponse(error);
      }
    }, "onRequestPost");
    __name(normalizeUploadPath, "normalizeUploadPath");
  }
});

// ../.wrangler/tmp/pages-JmaDmr/functionsRoutes-0.33282656970487656.mjs
var routes;
var init_functionsRoutes_0_33282656970487656 = __esm({
  "../.wrangler/tmp/pages-JmaDmr/functionsRoutes-0.33282656970487656.mjs"() {
    "use strict";
    init_agent_manifest();
    init_download_url();
    init_folder();
    init_list();
    init_login();
    init_logout();
    init_object();
    init_topic2();
    init_topic2();
    init_topic2();
    init_topic2();
    init_upload_complete();
    init_upload_url();
    routes = [
      {
        routePath: "/api/drive/agent-manifest",
        mountPath: "/api/drive",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost]
      },
      {
        routePath: "/api/drive/download-url",
        mountPath: "/api/drive",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost2]
      },
      {
        routePath: "/api/drive/folder",
        mountPath: "/api/drive",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost3]
      },
      {
        routePath: "/api/drive/list",
        mountPath: "/api/drive",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet]
      },
      {
        routePath: "/api/drive/login",
        mountPath: "/api/drive",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost4]
      },
      {
        routePath: "/api/drive/logout",
        mountPath: "/api/drive",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost5]
      },
      {
        routePath: "/api/drive/object",
        mountPath: "/api/drive",
        method: "DELETE",
        middlewares: [],
        modules: [onRequestDelete]
      },
      {
        routePath: "/api/drive/topic",
        mountPath: "/api/drive",
        method: "DELETE",
        middlewares: [],
        modules: [onRequestDelete2]
      },
      {
        routePath: "/api/drive/topic",
        mountPath: "/api/drive",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet2]
      },
      {
        routePath: "/api/drive/topic",
        mountPath: "/api/drive",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost6]
      },
      {
        routePath: "/api/drive/topic",
        mountPath: "/api/drive",
        method: "PUT",
        middlewares: [],
        modules: [onRequestPut]
      },
      {
        routePath: "/api/drive/upload-complete",
        mountPath: "/api/drive",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost7]
      },
      {
        routePath: "/api/drive/upload-url",
        mountPath: "/api/drive",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost8]
      }
    ];
  }
});

// ../.wrangler/tmp/bundle-2V6QUm/middleware-loader.entry.ts
init_functionsRoutes_0_33282656970487656();

// ../.wrangler/tmp/bundle-2V6QUm/middleware-insertion-facade.js
init_functionsRoutes_0_33282656970487656();

// ../node_modules/wrangler/templates/pages-template-worker.ts
init_functionsRoutes_0_33282656970487656();

// ../node_modules/path-to-regexp/dist.es2015/index.js
init_functionsRoutes_0_33282656970487656();
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_functionsRoutes_0_33282656970487656();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_functionsRoutes_0_33282656970487656();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-2V6QUm/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
init_functionsRoutes_0_33282656970487656();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-2V6QUm/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
/*! Bundled license information:

aws4fetch/dist/aws4fetch.esm.mjs:
  (**
   * @license MIT <https://opensource.org/licenses/MIT>
   * @copyright Michael Hart 2024
   *)
*/
//# sourceMappingURL=functionsWorker-0.22671640416101113.mjs.map
