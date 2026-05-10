type AIModelPurpose = "chat" | "export" | "formula";

export type AIMessageRole = "system" | "user" | "assistant";

export type AIContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type AIMessageContent = string | AIContentPart[];

export interface AIChatMessage {
  role: AIMessageRole;
  content: AIMessageContent;
}

interface GenerateTextOptions {
  purpose?: AIModelPurpose;
  model?: string;
  system?: string;
  messages: AIChatMessage[];
  temperature?: number;
  maxOutputTokens?: number;
}

interface GatewayConfig {
  apiKey: string;
  rootURL: string;
  exactGenerateURL?: string;
}

interface GatewayEndpoint {
  provider: "vertex" | "gemini" | "custom";
  path: string;
}

type AIProvider = "ai-gateway" | "gemini-aistudio";

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

interface GatewayGenerateBody {
  notification?: boolean;
  model: string;
  providerPayload: {
    contents: GeminiContent[];
    systemInstruction?: {
      parts: Array<{ text: string }>;
    };
    generationConfig?: {
      temperature?: number;
      maxOutputTokens?: number;
    };
  };
}

interface GatewayGenerateResponse {
  accepted?: boolean;
  requestId?: string;
  status?: string;
  error?: string | null;
  output?: string;
  text?: string;
  response?: string;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface GatewayRequestStatusResponse {
  requestId?: string;
  provider?: string;
  model?: string;
  status?: string;
  output?: string | null;
  error?: string | null;
}

class AIGatewayError extends Error {
  status: number;
  provider: string;
  body: string;

  constructor(message: string, status: number, provider: string, body: string) {
    super(message);
    this.name = "AIGatewayError";
    this.status = status;
    this.provider = provider;
    this.body = body;
  }
}

const DEFAULT_GATEWAY_MODEL = "gemini-3-flash-preview";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com";
const DEFAULT_SYNC_GATEWAY_TIMEOUT_MS = 35_000;
const DEFAULT_ASYNC_GATEWAY_TIMEOUT_MS = 45_000;
const ASYNC_POLL_INTERVAL_MS = 1_400;

function getAIProvider(): AIProvider {
  const rawProvider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (rawProvider === "gemini" || rawProvider === "gemini-aistudio" || rawProvider === "aistudio") {
    return "gemini-aistudio";
  }

  return "ai-gateway";
}

function getRawGatewayUrl() {
  return process.env.AI_GATEWAY_PRIMARY_URL?.trim() ?? "";
}

function getRawGatewayKey() {
  return process.env.AI_GATEWAY_PRIMARY_KEY?.trim() ?? "";
}

function getRawGeminiKey() {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || "";
}

function getGatewayConfig(): GatewayConfig {
  const gatewayUrl = getRawGatewayUrl();
  const gatewayKey = getRawGatewayKey();

  if (!gatewayUrl || !gatewayKey) {
    throw new Error("Missing AI_GATEWAY_PRIMARY_URL or AI_GATEWAY_PRIMARY_KEY in backend env.");
  }

  return {
    apiKey: gatewayKey,
    ...normalizeGatewayURL(gatewayUrl),
  };
}

function normalizeGatewayURL(value: string) {
  const normalized = value.replace(/\/+$/, "");

  if (/\/v1\/(?:vertex|gemini)\/generate$/i.test(normalized)) {
    return {
      rootURL: normalized.replace(/\/v1\/(?:vertex|gemini)\/generate$/i, ""),
      exactGenerateURL: normalized,
    };
  }

  if (/\/v1$/i.test(normalized)) {
    return {
      rootURL: normalized.replace(/\/v1$/i, ""),
    };
  }

  return {
    rootURL: normalized,
  };
}

export function getAIProviderSetupError() {
  try {
    if (getAIProvider() === "gemini-aistudio") {
      if (!getRawGeminiKey()) {
        throw new Error("Missing GEMINI_API_KEY in backend env.");
      }
    } else {
      getGatewayConfig();
    }

    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export function getAIProviderUserMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const providerLabel = getAIProvider() === "gemini-aistudio" ? "Gemini AI Studio" : "AI Gateway";
  const hasProcessingTimeout = /async request timed out|last status:\s*processing|timeout|524|504/i.test(message);
  const hasCapacityError = /no available processing capacity|service unavailable|capacity| 503[:\s]/i.test(message);

  if (/gemini ai studio returned 40[13]|permission_denied|denied access|api key not valid|permission denied/i.test(message)) {
    return "Gemini AI Studio đang từ chối project/API key hiện tại (403 PERMISSION_DENIED). Hãy đổi AI_PROVIDER=ai-gateway trong .env.local nếu đã có gateway, hoặc tạo Gemini API key mới từ project khác. Nếu đang dùng model preview, đổi GEMINI_MODEL về gemini-2.5-flash rồi khởi động lại server.";
  }

  if (hasProcessingTimeout && hasCapacityError) {
    return `${providerLabel} đang kẹt: provider xử lý quá lâu hoặc đang hết capacity. Đây là lỗi phía provider/model, không phải do ảnh hoặc prompt. Bạn thử gửi lại sau ít phút, hoặc cắt ảnh/file thành phần nhỏ hơn để request nhẹ hơn.`;
  }

  if (hasProcessingTimeout) {
    return `${providerLabel} xử lý quá lâu nên app đã tạm dừng chờ. Bạn thử gửi yêu cầu ngắn hơn, cắt ảnh rõ phần bài cần đọc, hoặc chia tài liệu thành từng phần nhỏ để AI trả lời ổn định hơn.`;
  }

  if (/no available processing capacity|service unavailable|capacity| 503[:\s]/i.test(message)) {
    return `${providerLabel} đang quá tải hoặc chưa có provider rảnh. Bạn thử lại sau ít phút nhé. Nếu đang gửi file lớn, hãy chia nhỏ yêu cầu trước khi gửi lại.`;
  }

  if (/async request timed out|last status:\s*processing|timeout|524|504/i.test(message)) {
    return `${providerLabel} xử lý quá lâu nên app đã tạm dừng chờ. Bạn thử gửi yêu cầu ngắn hơn, hoặc chia tài liệu thành từng phần như 5-10 câu một lần để AI trả lời ổn định hơn.`;
  }

  if (/missing ai_gateway_primary_url|missing ai_gateway_primary_key/i.test(message)) {
    return "Backend chưa có AI_GATEWAY_PRIMARY_URL hoặc AI_GATEWAY_PRIMARY_KEY. Hãy kiểm tra lại biến môi trường rồi khởi động lại server.";
  }

  if (/missing gemini_api_key|missing google_generative_ai_api_key/i.test(message)) {
    return "Backend chưa có GEMINI_API_KEY cho Gemini AI Studio. Hãy vào trang Admin để nhập key, hoặc thêm GEMINI_API_KEY vào .env.local rồi khởi động lại server.";
  }

  return message || "Không gọi được AI Gateway.";
}

export function isAIProviderRecoverableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return /async request timed out|last status:\s*processing|timeout|524|504|429|502|503|no available processing capacity|service unavailable|capacity/i.test(message);
}

export function getAIProviderDebug() {
  if (getAIProvider() === "gemini-aistudio") {
    return {
      provider: "gemini-aistudio" as const,
      baseUrlHost: getUrlHost(GEMINI_API_BASE_URL),
      hasGatewayUrl: true,
      hasGatewayKey: Boolean(getRawGeminiKey()),
      generatePath: `/v1beta/models/${normalizeGeminiModelName(getAIModel())}:generateContent`,
    };
  }

  try {
    const config = getGatewayConfig();
    return {
      provider: "ai-gateway" as const,
      baseUrlHost: getUrlHost(config.rootURL),
      hasGatewayUrl: Boolean(getRawGatewayUrl()),
      hasGatewayKey: Boolean(getRawGatewayKey()),
      generatePath: config.exactGenerateURL
        ? new URL(config.exactGenerateURL).pathname
        : getGatewayEndpoints(config)[0]?.path ?? null,
    };
  } catch {
    return {
      provider: "missing" as const,
      baseUrlHost: getRawGatewayUrl() ? getUrlHost(getRawGatewayUrl()) : null,
      hasGatewayUrl: Boolean(getRawGatewayUrl()),
      hasGatewayKey: Boolean(getRawGatewayKey()),
      generatePath: null,
    };
  }
}

export function getAIModel(purpose: AIModelPurpose = "chat") {
  if (getAIProvider() === "gemini-aistudio") {
    const purposeModel =
      purpose === "chat"
        ? process.env.GEMINI_CHAT_MODEL?.trim()
        : purpose === "export"
          ? process.env.GEMINI_EXPORT_MODEL?.trim()
          : process.env.GEMINI_FORMULA_MODEL?.trim() || process.env.FORMULA_RECOGNITION_MODEL?.trim();

    return (
      purposeModel ||
      process.env.GEMINI_MODEL?.trim() ||
      process.env.AI_GATEWAY_MODEL?.trim() ||
      DEFAULT_GEMINI_MODEL
    );
  }

  const purposeModel =
    purpose === "chat"
      ? process.env.AI_GATEWAY_CHAT_MODEL?.trim()
      : purpose === "export"
        ? process.env.AI_GATEWAY_EXPORT_MODEL?.trim()
        : process.env.AI_GATEWAY_FORMULA_MODEL?.trim() || process.env.FORMULA_RECOGNITION_MODEL?.trim();

  return (
    purposeModel ||
    process.env.AI_GATEWAY_MODEL?.trim() ||
    DEFAULT_GATEWAY_MODEL
  );
}

export function getAIProviderLabel() {
  const debug = getAIProviderDebug();
  return `${debug.baseUrlHost ?? "missing"} ${debug.generatePath ?? ""} / ${getAIModel()}`.trim();
}

export function getOpenAIConfigForLog() {
  if (getAIProvider() === "gemini-aistudio") {
    return {
      provider: "gemini-aistudio",
      baseURL: GEMINI_API_BASE_URL,
      generatePath: `/v1beta/models/${normalizeGeminiModelName(getAIModel())}:generateContent`,
    };
  }

  const config = getGatewayConfig();
  const endpoint = getGatewayEndpoints(config)[0];

  return {
    provider: "ai-gateway",
    baseURL: config.rootURL,
    generatePath: config.exactGenerateURL
      ? new URL(config.exactGenerateURL).pathname
      : endpoint.path,
  };
}

export async function generateAIText(options: GenerateTextOptions) {
  if (getAIProvider() === "gemini-aistudio") {
    try {
      return await generateGeminiAIStudioText(options);
    } catch (error) {
      if (shouldFallbackFromGeminiAIStudio(error) && hasGatewayFallbackConfig()) {
        console.warn("Gemini AI Studio failed; falling back to AI Gateway.");
        return generateAIGatewayText(options);
      }

      throw error;
    }
  }

  return generateAIGatewayText(options);
}

async function generateAIGatewayText(options: GenerateTextOptions) {
  const config = getGatewayConfig();
  const model = options.model ?? getAIModel(options.purpose ?? "chat");
  const body = createGatewayBody({
    ...options,
    model,
  });
  const endpoints = getGatewayEndpoints(config);
  const errors: AIGatewayError[] = [];

  for (const endpoint of endpoints) {
    try {
      const response = shouldUseAsyncGateway(options)
        ? await postGatewayGenerateAsync(config, endpoint, body)
        : await postGatewayGenerate(config, endpoint, body);
      return extractGatewayText(response);
    } catch (error) {
      if (error instanceof AIGatewayError) {
        errors.push(error);
        if (shouldTryNextEndpoint(error)) {
          continue;
        }
      }

      throw error;
    }
  }

  throw combineGatewayErrors(errors);
}

async function generateGeminiAIStudioText(options: GenerateTextOptions) {
  const apiKey = getRawGeminiKey();
  const model = normalizeGeminiModelName(options.model ?? getAIModel(options.purpose ?? "chat"));

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in backend env.");
  }

  const body = createGeminiAIStudioBody({
    ...options,
    model,
  });
  const url = `${GEMINI_API_BASE_URL}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }, getSyncGatewayTimeoutMs());
  const responseText = await response.text();

  if (!response.ok) {
    throw new AIGatewayError(
      `Gemini AI Studio returned ${response.status}: ${truncate(stripHtml(responseText), 360)}`,
      response.status,
      "gemini-aistudio",
      responseText
    );
  }

  return extractGatewayText(parseGatewayResponse(responseText));
}

function shouldFallbackFromGeminiAIStudio(error: unknown) {
  if (!(error instanceof AIGatewayError) || error.provider !== "gemini-aistudio") {
    return false;
  }

  return [401, 403, 404, 408, 429, 500, 502, 503, 504].includes(error.status);
}

function hasGatewayFallbackConfig() {
  return Boolean(getRawGatewayUrl() && getRawGatewayKey());
}

function createGeminiAIStudioBody(options: Required<Pick<GenerateTextOptions, "model">> & GenerateTextOptions) {
  const gatewayBody = createGatewayBody(options);
  return gatewayBody.providerPayload;
}

function createGatewayBody(options: Required<Pick<GenerateTextOptions, "model">> & GenerateTextOptions): GatewayGenerateBody {
  const { system, contents } = toGeminiContents(options.messages);
  const systemText = [options.system, system].filter(Boolean).join("\n\n").trim();
  const generationConfig: GatewayGenerateBody["providerPayload"]["generationConfig"] = {};

  if (typeof options.temperature === "number") {
    generationConfig.temperature = options.temperature;
  }

  if (typeof options.maxOutputTokens === "number") {
    generationConfig.maxOutputTokens = options.maxOutputTokens;
  }

  return {
    model: options.model,
    providerPayload: {
      contents,
      ...(systemText
        ? {
            systemInstruction: {
              parts: [{ text: systemText }],
            },
          }
        : {}),
      ...(Object.keys(generationConfig).length > 0 ? { generationConfig } : {}),
    },
  };
}

function toGeminiContents(messages: AIChatMessage[]) {
  const systemParts: string[] = [];
  const contents: GeminiContent[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      const text = getTextFromContent(message.content).trim();
      if (text) {
        systemParts.push(text);
      }
      continue;
    }

    const parts = toGeminiParts(message.content);
    if (parts.length === 0) {
      continue;
    }

    contents.push({
      role: message.role === "assistant" ? "model" : "user",
      parts,
    });
  }

  if (contents.length === 0) {
    contents.push({
      role: "user",
      parts: [{ text: "" }],
    });
  }

  return {
    system: systemParts.join("\n\n"),
    contents,
  };
}

function toGeminiParts(content: AIMessageContent): GeminiPart[] {
  if (typeof content === "string") {
    return content.trim() ? [{ text: content }] : [];
  }

  return content.flatMap((part): GeminiPart[] => {
    if (part.type === "text") {
      return part.text.trim() ? [{ text: part.text }] : [];
    }

    const inlineData = dataUrlToInlineData(part.image_url.url);
    return inlineData ? [{ inlineData }] : [];
  });
}

function getTextFromContent(content: AIMessageContent) {
  if (typeof content === "string") {
    return content;
  }

  return content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function dataUrlToInlineData(value: string) {
  const match = value.match(/^data:([^;]+);base64,(.+)$/i);
  if (!match?.[1] || !match[2]) {
    return null;
  }

  return {
    mimeType: match[1],
    data: match[2],
  };
}

function getGatewayEndpoints(config: GatewayConfig): GatewayEndpoint[] {
  const configuredPath = process.env.AI_GATEWAY_GENERATE_PATH?.trim();
  if (configuredPath) {
    return [
      {
        provider: "custom",
        path: configuredPath.startsWith("/") ? configuredPath : `/${configuredPath}`,
      },
    ];
  }

  if (config.exactGenerateURL) {
    return [
      {
        provider: "custom",
        path: new URL(config.exactGenerateURL).pathname,
      },
    ];
  }

  const preferredProvider = process.env.AI_GATEWAY_PROVIDER?.trim().toLowerCase();
  const vertex: GatewayEndpoint = { provider: "vertex", path: "/v1/vertex/generate" };
  const gemini: GatewayEndpoint = { provider: "gemini", path: "/v1/gemini/generate" };

  if (preferredProvider === "gemini") {
    return [gemini, vertex];
  }

  return [vertex, gemini];
}

async function postGatewayGenerate(
  config: GatewayConfig,
  endpoint: GatewayEndpoint,
  body: GatewayGenerateBody
) {
  const url = config.exactGenerateURL ?? `${config.rootURL}${endpoint.path}`;
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: getGatewayHeaders(config),
    body: JSON.stringify(body),
  }, getSyncGatewayTimeoutMs());
  const responseText = await response.text();

  if (!response.ok) {
    throw createGatewayError(endpoint, response.status, responseText);
  }

  return parseGatewayResponse(responseText);
}

async function postGatewayGenerateAsync(
  config: GatewayConfig,
  endpoint: GatewayEndpoint,
  body: GatewayGenerateBody
) {
  const url = config.exactGenerateURL ?? `${config.rootURL}${endpoint.path}`;
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: getGatewayHeaders(config),
    body: JSON.stringify({
      ...body,
      notification: true,
    }),
  }, getSyncGatewayTimeoutMs());
  const responseText = await response.text();

  if (!response.ok) {
    throw createGatewayError(endpoint, response.status, responseText);
  }

  const accepted = parseGatewayResponse(responseText);
  if (!accepted.requestId) {
    return accepted;
  }

  return pollGatewayRequest(config, endpoint, accepted.requestId);
}

async function pollGatewayRequest(
  config: GatewayConfig,
  endpoint: GatewayEndpoint,
  requestId: string
): Promise<GatewayGenerateResponse> {
  const startedAt = Date.now();
  let lastStatus: GatewayRequestStatusResponse | null = null;
  const asyncTimeoutMs = getAsyncGatewayTimeoutMs();

  while (Date.now() - startedAt < asyncTimeoutMs) {
    await wait(ASYNC_POLL_INTERVAL_MS);

    const status = await getGatewayRequestStatus(config, requestId);
    lastStatus = status;
    const normalizedStatus = status.status?.toLowerCase();

    if (normalizedStatus === "completed" || normalizedStatus === "success") {
      return {
        output: status.output ?? "",
        requestId: status.requestId,
        status: status.status,
      };
    }

    if (normalizedStatus === "failed" || normalizedStatus === "fail" || normalizedStatus === "error") {
      throw createGatewayError(endpoint, 503, status.error || "Async gateway request failed.");
    }
  }

  throw createGatewayError(
    endpoint,
    504,
    `Gateway async request timed out after ${Math.round(asyncTimeoutMs / 1000)}s.${
      lastStatus?.status ? ` Last status: ${lastStatus.status}.` : ""
    }`
  );
}

async function getGatewayRequestStatus(config: GatewayConfig, requestId: string) {
  const url = `${config.rootURL}/v1/requests/${encodeURIComponent(requestId)}/status`;
  const response = await fetchWithTimeout(url, {
    method: "GET",
    headers: getGatewayHeaders(config),
  }, 12_000);
  const responseText = await response.text();

  if (!response.ok) {
    throw new AIGatewayError(
      `AI Gateway status returned ${response.status}: ${stripHtml(responseText)}`,
      response.status,
      "custom",
      responseText
    );
  }

  return parseGatewayResponse(responseText) as GatewayRequestStatusResponse;
}

function parseGatewayResponse(value: string): GatewayGenerateResponse {
  try {
    return JSON.parse(value) as GatewayGenerateResponse;
  } catch {
    return {
      output: value,
    };
  }
}

function extractGatewayText(response: GatewayGenerateResponse) {
  if (typeof response.output === "string") {
    return response.output;
  }

  if (typeof response.text === "string") {
    return response.text;
  }

  if (typeof response.response === "string") {
    return response.response;
  }

  return response.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("") ?? "";
}

function shouldTryNextEndpoint(error: AIGatewayError) {
  return [404, 408, 429, 500, 502, 503, 504, 522, 524].includes(error.status);
}

function combineGatewayErrors(errors: AIGatewayError[]) {
  if (errors.length === 0) {
    return new Error("AI Gateway request failed.");
  }

  const detail = errors
    .map((error) => `${error.provider} ${error.status}: ${truncate(stripHtml(error.body), 180)}`)
    .join(" | ");

  return new Error(`AI Gateway request failed. ${detail}`);
}

function shouldUseAsyncGateway(options: GenerateTextOptions) {
  const explicit = process.env.AI_GATEWAY_ASYNC?.trim().toLowerCase();
  if (explicit === "false" || explicit === "0" || explicit === "off") {
    return false;
  }

  if (explicit === "true" || explicit === "1" || explicit === "on") {
    return true;
  }

  return options.purpose !== "formula";
}

function getGatewayHeaders(config: GatewayConfig) {
  return {
    "Content-Type": "application/json",
    "x-api-key": config.apiKey,
  };
}

function getSyncGatewayTimeoutMs() {
  return getPositiveNumberEnv("AI_GATEWAY_SYNC_TIMEOUT_MS", DEFAULT_SYNC_GATEWAY_TIMEOUT_MS);
}

function getAsyncGatewayTimeoutMs() {
  return getPositiveNumberEnv("AI_GATEWAY_ASYNC_TIMEOUT_MS", DEFAULT_ASYNC_GATEWAY_TIMEOUT_MS);
}

function getPositiveNumberEnv(name: string, fallback: number) {
  const rawValue = process.env[name]?.trim();
  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new AIGatewayError(
        `AI Gateway request timed out after ${Math.round(timeoutMs / 1000)}s.`,
        504,
        "custom",
        `timeout after ${timeoutMs}ms`
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function createGatewayError(endpoint: GatewayEndpoint, status: number, body: string) {
  const cleanBody = stripHtml(body);
  return new AIGatewayError(
    `AI Gateway ${endpoint.provider} returned ${status}: ${truncate(cleanBody, 360)}`,
    status,
    endpoint.provider,
    body
  );
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#38;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncate(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}...`
    : normalized;
}

function normalizeGeminiModelName(model: string) {
  return model.replace(/^models\//, "").trim() || DEFAULT_GEMINI_MODEL;
}

function getUrlHost(value: string) {
  try {
    return new URL(value).host;
  } catch {
    return value;
  }
}
