import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { appendAdminActivity } from "@/lib/admin-store";

const ADMIN_USERNAME = "admin123";
const ENV_FILE = ".env.local";

type ProviderId = "ai-gateway" | "gemini-aistudio";

interface ProviderRequestBody {
  provider?: ProviderId;
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(getProviderSnapshot());
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as ProviderRequestBody;
  const provider = normalizeProvider(body.provider);
  const updates: Record<string, string | undefined> = {
    AI_PROVIDER: provider,
    NEXT_PUBLIC_MODEL_NAME: provider === "gemini-aistudio" ? "Gemini AI Studio" : "AI Gateway",
  };

  await writeEnvUpdates(updates);
  await appendAdminActivity({
    type: "provider",
    title: "Provider changed",
    detail: provider === "gemini-aistudio" ? "Gemini AI Studio" : "AI Gateway",
    actor: ADMIN_USERNAME,
  });

  return NextResponse.json({
    ok: true,
    config: getProviderSnapshot(),
  });
}

function isAdminRequest(req: NextRequest) {
  return req.headers.get("x-admin-user") === ADMIN_USERNAME;
}

function normalizeProvider(provider: string | undefined): ProviderId {
  const normalized = provider?.trim().toLowerCase();
  return normalized === "gemini" || normalized === "aistudio" || normalized === "gemini-aistudio"
    ? "gemini-aistudio"
    : "ai-gateway";
}

function getProviderSnapshot() {
  const provider = normalizeProvider(process.env.AI_PROVIDER as ProviderId | undefined);

  return {
    provider,
    activeModel: provider === "gemini-aistudio"
      ? process.env.GEMINI_MODEL || "gemini-2.5-flash"
      : process.env.AI_GATEWAY_MODEL || "gemini-2.5-flash",
    gateway: {
      url: process.env.AI_GATEWAY_PRIMARY_URL || "",
      hasKey: Boolean(process.env.AI_GATEWAY_PRIMARY_KEY),
      model: process.env.AI_GATEWAY_MODEL || "gemini-2.5-flash",
      preferredProvider: process.env.AI_GATEWAY_PROVIDER || "gemini",
      asyncTimeoutMs: process.env.AI_GATEWAY_ASYNC_TIMEOUT_MS || "30000",
    },
    gemini: {
      hasKey: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY),
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    },
    envFile: ENV_FILE,
  };
}

async function writeEnvUpdates(updates: Record<string, string | undefined>) {
  const envPath = path.join(process.cwd(), ENV_FILE);
  let content = "";

  try {
    content = await fs.readFile(envPath, "utf8");
  } catch {
    content = "";
  }

  const nextContent = mergeEnvContent(content, updates);
  await fs.writeFile(envPath, nextContent, "utf8");

  for (const [key, value] of Object.entries(updates)) {
    if (typeof value === "string") {
      process.env[key] = value;
    }
  }
}

function mergeEnvContent(content: string, updates: Record<string, string | undefined>) {
  const seen = new Set<string>();
  const lines = content.split(/\r?\n/).map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match) {
      return line;
    }

    const key = match[1];
    const value = updates[key];
    if (typeof value !== "string") {
      return line;
    }

    seen.add(key);
    return `${key}=${serializeEnvValue(value)}`;
  });

  const missingLines = Object.entries(updates)
    .filter(([key, value]) => typeof value === "string" && !seen.has(key))
    .map(([key, value]) => `${key}=${serializeEnvValue(value ?? "")}`);

  const trimmedLines = lines.filter((line, index) => line.length > 0 || index < lines.length - 1);
  return [...trimmedLines, ...missingLines, ""].join("\n");
}

function serializeEnvValue(value: string) {
  return /[\s#"'`]/.test(value) ? JSON.stringify(value) : value;
}
