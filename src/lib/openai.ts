import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getBaseURL(): string | undefined {
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  if (!baseURL) return undefined;

  const normalizedBaseURL = baseURL.replace(/\/+$/, "");

  if (/\/anthropic(?:\/v\d+)?$/i.test(normalizedBaseURL)) {
    throw new Error(
      "OPENAI_BASE_URL points to an Anthropic-compatible endpoint, but this app uses OpenAI chat completions. For MiniMax, set OPENAI_BASE_URL=https://api.minimax.io/v1"
    );
  }

  return normalizedBaseURL;
}

export function getOpenAI(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const clientConfig: { apiKey: string; baseURL?: string } = {
      apiKey: process.env.OPENAI_API_KEY,
    };

    const baseURL = getBaseURL();
    if (baseURL) {
      clientConfig.baseURL = baseURL;
    }

    openaiClient = new OpenAI(clientConfig);
  }
  return openaiClient;
}
