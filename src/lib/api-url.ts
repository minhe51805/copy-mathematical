const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/+$/, "");
const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

export function getApiUrl(path: `/api/${string}`) {
  if (configuredApiBaseUrl) {
    return `${configuredApiBaseUrl}${path}`;
  }

  if (basePath) {
    return `${basePath}${path}`;
  }

  return path;
}

export function hasRuntimeApi() {
  return Boolean(configuredApiBaseUrl || !isStaticExport);
}
