import {
  isTeacherResearchPrompt,
  normalizeForSearchIntent,
} from "@/lib/teacher-research-intent";

type ResearchProvider = "searxng" | "tavily" | "brave" | "wikipedia" | "duckduckgo";

interface IncomingMessageLike {
  role: "user" | "assistant";
  content?: string;
}

interface TeacherResearchOptions {
  mode?: string;
  messages: IncomingMessageLike[];
}

interface SearchSource {
  title: string;
  url: string;
  snippet: string;
  provider: ResearchProvider;
  query: string;
}

export interface TeacherResearchContext {
  prompt: string;
  sourceCount: number;
  queries: string[];
  providers: string[];
}

const DEFAULT_MAX_RESULTS = 8;
const DEFAULT_MAX_QUERIES = 3;
const DEFAULT_MIN_SOURCES_FOR_FALLBACK = 4;
const SEARCH_TIMEOUT_MS = 10_000;

export async function createTeacherResearchContext({
  mode,
  messages,
}: TeacherResearchOptions): Promise<TeacherResearchContext | null> {
  if (mode !== "teacher" || !isTeacherResearchEnabled()) {
    return null;
  }

  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  const userRequest = latestUserMessage?.content?.trim() ?? "";

  if (!userRequest || !shouldRunTeacherResearch(userRequest)) {
    return null;
  }

  const queries = buildResearchQueries(userRequest);
  if (queries.length === 0) {
    return null;
  }

  let sources = await searchTeacherSources(queries);

  if (sources.length < DEFAULT_MIN_SOURCES_FOR_FALLBACK) {
    const fallbackQueries = buildFallbackResearchQueries(userRequest, queries);
    if (fallbackQueries.length > 0) {
      const fallbackSources = await searchTeacherSources(fallbackQueries);
      sources = dedupeAndRankSources([...sources, ...fallbackSources]);
    }
  }

  return formatTeacherResearchContext(userRequest, queries, sources);
}

function isTeacherResearchEnabled() {
  const raw = process.env.TEACHER_RESEARCH_ENABLED?.trim().toLowerCase();
  return raw !== "false" && raw !== "0" && raw !== "off";
}

function shouldRunTeacherResearch(content: string) {
  if (process.env.TEACHER_RESEARCH_ALWAYS?.trim().toLowerCase() === "true") {
    return true;
  }

  return isTeacherResearchPrompt(content);
}

function buildResearchQueries(content: string) {
  const cleaned = normalizeQueryText(content);
  const maxQueries = getPositiveNumberEnv(
    "TEACHER_RESEARCH_MAX_QUERIES",
    DEFAULT_MAX_QUERIES
  );

  const queries = uniqueStrings([
    limitQuery(cleaned),
    ...extractClauseQueries(cleaned),
    needsEducationContext(cleaned)
      ? limitQuery(`${cleaned} giáo dục toán học tài liệu tham khảo`)
      : "",
    needsOfficialEducationSource(cleaned)
      ? limitQuery(`${cleaned} site:moet.gov.vn`)
      : "",
    limitQuery(`${cleaned} nguồn tham khảo chính thống kiểm chứng cập nhật mới`),
  ].filter(Boolean));

  return queries.slice(0, maxQueries);
}

function buildFallbackResearchQueries(content: string, primaryQueries: string[]) {
  const cleaned = normalizeQueryText(content);
  const fallbackQueries = uniqueStrings([
    needsEducationContext(cleaned)
      ? limitQuery(`${cleaned} giáo án tài liệu tham khảo`)
      : limitQuery(`${cleaned} nguồn tham khảo chính thống`),
    needsOfficialEducationSource(cleaned)
      ? limitQuery(`${cleaned} site:moet.gov.vn filetype:pdf`)
      : limitQuery(`${cleaned} kiểm chứng thông tin`),
  ]).filter((query) => !primaryQueries.includes(query));

  return fallbackQueries.slice(0, 2);
}

function needsEducationContext(value: string) {
  const normalized = normalizeForSearchIntent(value);
  return /\b(giao|hoc|toan|bai day|giao an|lesson|worksheet|curriculum|sach giao khoa|tai lieu tham khao)\b/.test(
    normalized
  );
}

function needsOfficialEducationSource(value: string) {
  const normalized = normalizeForSearchIntent(value);
  return /\b(bo giao duc|moet|chuong trinh|sach giao khoa|thong tu|chuan)\b/.test(
    normalized
  );
}

async function searchTeacherSources(queries: string[]) {
  const maxResults = getPositiveNumberEnv(
    "TEACHER_RESEARCH_MAX_RESULTS",
    DEFAULT_MAX_RESULTS
  );
  const providers = getResearchProviders();
  const perProviderResults = Math.max(
    2,
    Math.ceil(maxResults / Math.max(1, providers.length))
  );

  const tasks = queries.flatMap((query) =>
    providers.map((provider) =>
      runProviderSearch(provider, query, perProviderResults)
    )
  );
  const settled = await Promise.allSettled(tasks);
  const sources = settled.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  return dedupeAndRankSources(sources).slice(0, maxResults);
}

function getResearchProviders(): ResearchProvider[] {
  const preferred = process.env.TEACHER_RESEARCH_SEARCH_PROVIDER
    ?.trim()
    .toLowerCase();

  if (isResearchProvider(preferred)) {
    return [preferred];
  }

  const providers: ResearchProvider[] = [];
  if (getSearxngUrl()) providers.push("searxng");
  if (getEnv("TEACHER_RESEARCH_TAVILY_API_KEY", "TAVILY_API_KEY")) {
    providers.push("tavily");
  }
  if (getEnv("TEACHER_RESEARCH_BRAVE_API_KEY", "BRAVE_SEARCH_API_KEY")) {
    providers.push("brave");
  }

  providers.push("wikipedia", "duckduckgo");
  return uniqueStrings(providers) as ResearchProvider[];
}

function isResearchProvider(
  value: string | undefined
): value is ResearchProvider {
  return (
    value === "searxng" ||
    value === "tavily" ||
    value === "brave" ||
    value === "wikipedia" ||
    value === "duckduckgo"
  );
}

async function runProviderSearch(
  provider: ResearchProvider,
  query: string,
  maxResults: number
) {
  try {
    if (provider === "searxng") return searchSearxng(query, maxResults);
    if (provider === "tavily") return searchTavily(query, maxResults);
    if (provider === "brave") return searchBrave(query, maxResults);
    if (provider === "wikipedia") return searchWikipedia(query, maxResults);
    return searchDuckDuckGo(query, maxResults);
  } catch (error) {
    console.warn(
      `Teacher research ${provider} search failed:`,
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

async function searchSearxng(
  query: string,
  maxResults: number
): Promise<SearchSource[]> {
  const baseUrl = getSearxngUrl();
  if (!baseUrl) return [];

  const url = new URL("/search", baseUrl);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("safesearch", "1");
  url.searchParams.set(
    "language",
    process.env.TEACHER_RESEARCH_SEARCH_LANGUAGE || "vi-VN"
  );

  const data = await fetchJson<{ results?: Array<{ title?: string; url?: string; content?: string }> }>(
    url.toString()
  );

  return (data.results ?? [])
    .slice(0, maxResults)
    .map((item) => ({
      title: item.title ?? "Untitled result",
      url: item.url ?? "",
      snippet: cleanSnippet(item.content ?? ""),
      provider: "searxng" as const,
      query,
    }))
    .filter(hasUsableSource);
}

async function searchTavily(
  query: string,
  maxResults: number
): Promise<SearchSource[]> {
  const apiKey = getEnv("TEACHER_RESEARCH_TAVILY_API_KEY", "TAVILY_API_KEY");
  if (!apiKey) return [];

  const data = await fetchJson<{
    results?: Array<{ title?: string; url?: string; content?: string; raw_content?: string }>;
  }>("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults,
      search_depth: "basic",
      include_answer: false,
      include_raw_content: false,
    }),
  });

  return (data.results ?? [])
    .slice(0, maxResults)
    .map((item) => ({
      title: item.title ?? "Untitled result",
      url: item.url ?? "",
      snippet: cleanSnippet(item.content ?? item.raw_content ?? ""),
      provider: "tavily" as const,
      query,
    }))
    .filter(hasUsableSource);
}

async function searchBrave(
  query: string,
  maxResults: number
): Promise<SearchSource[]> {
  const apiKey = getEnv("TEACHER_RESEARCH_BRAVE_API_KEY", "BRAVE_SEARCH_API_KEY");
  if (!apiKey) return [];

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(Math.min(maxResults, 10)));
  url.searchParams.set("safesearch", "moderate");

  const data = await fetchJson<{
    web?: { results?: Array<{ title?: string; url?: string; description?: string }> };
  }>(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
  });

  return (data.web?.results ?? [])
    .slice(0, maxResults)
    .map((item) => ({
      title: item.title ?? "Untitled result",
      url: item.url ?? "",
      snippet: cleanSnippet(item.description ?? ""),
      provider: "brave" as const,
      query,
    }))
    .filter(hasUsableSource);
}

async function searchWikipedia(
  query: string,
  maxResults: number
): Promise<SearchSource[]> {
  const lang = process.env.TEACHER_RESEARCH_WIKIPEDIA_LANG?.trim() || "vi";
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("utf8", "1");
  url.searchParams.set("origin", "*");
  url.searchParams.set("srlimit", String(Math.min(maxResults, 10)));

  const data = await fetchJson<{
    query?: { search?: Array<{ title?: string; snippet?: string }> };
  }>(url.toString());

  return (data.query?.search ?? [])
    .slice(0, maxResults)
    .map((item) => {
      const title = item.title ?? "Wikipedia";
      return {
        title,
        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(
          title.replace(/\s+/g, "_")
        )}`,
        snippet: cleanSnippet(item.snippet ?? ""),
        provider: "wikipedia" as const,
        query,
      };
    })
    .filter(hasUsableSource);
}

async function searchDuckDuckGo(
  query: string,
  maxResults: number
): Promise<SearchSource[]> {
  const url = new URL("https://api.duckduckgo.com/");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("no_html", "1");
  url.searchParams.set("skip_disambig", "1");
  url.searchParams.set("no_redirect", "1");

  const data = await fetchJson<{
    AbstractText?: string;
    AbstractURL?: string;
    Heading?: string;
    RelatedTopics?: Array<{
      Text?: string;
      FirstURL?: string;
      Name?: string;
      Topics?: Array<{ Text?: string; FirstURL?: string }>;
    }>;
  }>(url.toString());
  const sources: SearchSource[] = [];

  if (data.AbstractText && data.AbstractURL) {
    sources.push({
      title: data.Heading || "DuckDuckGo instant answer",
      url: data.AbstractURL,
      snippet: cleanSnippet(data.AbstractText),
      provider: "duckduckgo",
      query,
    });
  }

  for (const topic of data.RelatedTopics ?? []) {
    const nestedTopics = topic.Topics ?? [topic];
    for (const nested of nestedTopics) {
      if (!nested.Text || !nested.FirstURL) continue;
      sources.push({
        title: topic.Name || inferTitleFromSnippet(nested.Text),
        url: nested.FirstURL,
        snippet: cleanSnippet(nested.Text),
        provider: "duckduckgo",
        query,
      });
      if (sources.length >= maxResults) return sources.filter(hasUsableSource);
    }
  }

  return sources.slice(0, maxResults).filter(hasUsableSource);
}

function formatTeacherResearchContext(
  userRequest: string,
  queries: string[],
  sources: SearchSource[]
): TeacherResearchContext {
  const providers = uniqueStrings(sources.map((source) => source.provider));
  const queryLines = queries
    .map((query, index) => `[Q${index + 1}] ${query}`)
    .join("\n");
  const sourceLines = sources.map((source, index) =>
    [
      `[S${index + 1}] ${source.title}`,
      `Provider: ${source.provider}`,
      `Query: ${source.query}`,
      `URL: ${source.url}`,
      `Snippet: ${source.snippet || "(no short snippet)"}`,
    ].join("\n")
  );

  const prompt = [
    "TEACHER_WEB_RESEARCH_CONTEXT",
    "You are inside Teacher Studio. A research sub-agent has already searched the web for the latest request.",
    `User request: ${userRequest}`,
    "",
    "Rules for using sources:",
    "- Use only the sources below as support. Do not invent URLs, article titles, authors, or publication years.",
    "- When you mention any factual detail from a source, cite it inline as [S1], [S2], etc.",
    "- If sources are weak, incomplete, or only give a general overview, say exactly which part still needs verification.",
    "- Prefer turning the answer into teacher-friendly output: lesson ideas, questions, worksheets, references, answer keys, or review notes.",
    "- If sources disagree, say so instead of pretending the answer is certain.",
    "",
    "Research plan:",
    queryLines || "(none)",
    "",
    sources.length
      ? `Sources found: ${sources.length} via ${providers.join(", ") || "no provider"}`
      : "Sources found: 0. Tell the teacher that no strong web source was found and ask for a file, a more specific topic, or a different source configuration.",
    "",
    ...sourceLines,
  ].join("\n");

  return {
    prompt,
    sourceCount: sources.length,
    queries,
    providers,
  };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    getPositiveNumberEnv("TEACHER_RESEARCH_TIMEOUT_MS", SEARCH_TIMEOUT_MS)
  );

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "User-Agent": "AI-Math-Chat-Teacher-Research/1.0",
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function getSearxngUrl() {
  const value = getEnv("TEACHER_RESEARCH_SEARXNG_URL", "SEARXNG_URL");
  return value ? value.replace(/\/+$/, "") : "";
}

function getEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }

  return "";
}

function getPositiveNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]?.trim());
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function hasUsableSource(source: SearchSource) {
  return Boolean(source.title.trim() && source.url.trim());
}

function dedupeAndRankSources(sources: SearchSource[]) {
  const ranked = [...sources].sort((left, right) => scoreSource(left) - scoreSource(right));
  const seen = new Set<string>();
  const deduped: SearchSource[] = [];

  for (const source of ranked) {
    const key = normalizeUrlKey(source.url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(source);
  }

  return deduped;
}

function scoreSource(source: SearchSource) {
  let score = providerWeight(source.provider);
  if (isOfficialDomain(source.url)) {
    score -= 4;
  } else if (isEducationDomain(source.url)) {
    score -= 2;
  }

  if (!source.snippet.trim()) {
    score += 1;
  } else if (source.snippet.length > 240) {
    score -= 0.5;
  }

  return score;
}

function providerWeight(provider: ResearchProvider) {
  switch (provider) {
    case "searxng":
      return 0;
    case "tavily":
      return 1;
    case "brave":
      return 2;
    case "wikipedia":
      return 3;
    default:
      return 4;
  }
}

function isOfficialDomain(url: string) {
  const normalized = url.toLowerCase();
  return (
    normalized.includes("moet.gov.vn") ||
    normalized.includes(".gov.") ||
    normalized.includes(".edu.") ||
    normalized.includes("edu.vn")
  );
}

function isEducationDomain(url: string) {
  const normalized = url.toLowerCase();
  return (
    normalized.includes("moet") ||
    normalized.includes("giaovien") ||
    normalized.includes("tailieu") ||
    normalized.includes("education") ||
    normalized.includes("edu")
  );
}

function normalizeUrlKey(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.searchParams.delete("utm_source");
    parsed.searchParams.delete("utm_medium");
    parsed.searchParams.delete("utm_campaign");
    parsed.searchParams.delete("utm_term");
    parsed.searchParams.delete("utm_content");
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return url.trim();
  }
}

function cleanSnippet(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function inferTitleFromSnippet(value: string) {
  const clean = cleanSnippet(value);
  const firstSentence = clean.split(/[.!?]/)[0]?.trim();
  return firstSentence ? firstSentence.slice(0, 90) : "Search result";
}

function limitQuery(value: string) {
  return value.slice(0, 220).trim();
}

function normalizeQueryText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function extractClauseQueries(value: string) {
  const segments = value
    .split(/[\n;,.•·|/]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 18);

  return uniqueStrings(segments).slice(0, 2).map(limitQuery);
}

function uniqueStrings<T extends string>(values: T[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  ) as T[];
}
