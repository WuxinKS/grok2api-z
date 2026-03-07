import { Container } from "@cloudflare/containers";

const DEFAULT_INSTANCE = "grok2api";

function stripHopByHop(headers) {
  const out = new Headers(headers);
  [
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host"
  ].forEach((key) => out.delete(key));
  return out;
}

function pickEnvVars(env) {
  return {
    TZ: env.TZ || "Asia/Shanghai",
    SERVER_HOST: env.SERVER_HOST || "0.0.0.0",
    SERVER_PORT: env.SERVER_PORT || "8000",
    SERVER_WORKERS: env.SERVER_WORKERS || "1",
    LOG_LEVEL: env.LOG_LEVEL || "INFO",
    LOG_FILE_ENABLED: env.LOG_FILE_ENABLED || "false",
    DATA_DIR: env.DATA_DIR || "/tmp/data",
    SERVER_STORAGE_TYPE: env.SERVER_STORAGE_TYPE || "local",
    SERVER_STORAGE_URL: env.SERVER_STORAGE_URL || "",
    FLARESOLVERR_URL: env.FLARESOLVERR_URL || "",
    CF_REFRESH_INTERVAL: env.CF_REFRESH_INTERVAL || "600",
    CF_TIMEOUT: env.CF_TIMEOUT || "60"
  };
}

export class Grok2ApiContainer extends Container {
  defaultPort = 8000;
  sleepAfter = "10m";

  get envVars() {
    return pickEnvVars(this.env);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const instanceId = url.searchParams.get("instance") || DEFAULT_INSTANCE;
    const container = env.GROK2API_CONTAINER.getByName(instanceId, {
      envVars: pickEnvVars(env)
    });

    const upstreamUrl = new URL(request.url);
    upstreamUrl.searchParams.delete("instance");

    const method = request.method.toUpperCase();
    const init = {
      method,
      headers: stripHopByHop(request.headers),
      redirect: "manual"
    };

    if (method !== "GET" && method !== "HEAD") {
      init.body = request.body;
      init.duplex = "half";
    }

    const upstreamRequest = new Request(upstreamUrl.toString(), init);
    return container.fetch(upstreamRequest);
  }
};
