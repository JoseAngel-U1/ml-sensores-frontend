import { CapacitorHttp } from "@capacitor/core";

import { getApiUrl } from "../config/api";

const TIMEOUT_MS = 60_000;
let solicitudPendiente = false;
let finalizacionPendiente: Promise<void> = Promise.resolve();

export function waitForApiRequestCompletion(): Promise<void> {
  return finalizacionPendiente;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiRequest {
  method: "GET" | "POST";
  path: string;
  data?: unknown;
}

interface ApiResponse {
  status: number;
  data: unknown;
  elapsedMs: number;
}

export async function requestApi({ method, path, data }: ApiRequest): Promise<ApiResponse> {
  const url = getApiUrl(path);
  if (solicitudPendiente) {
    throw new ApiError("La solicitud anterior sigue finalizando. Espera unos instantes antes de reintentar.");
  }
  solicitudPendiente = true;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const inicio = performance.now();

  const solicitud = (async (): Promise<ApiResponse> => {
    try {
      const response = await CapacitorHttp.request({
        url,
        method,
        headers: {
          Accept: "application/json",
          ...(data === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(data === undefined ? {} : { data }),
        responseType: "text",
        connectTimeout: TIMEOUT_MS,
        readTimeout: TIMEOUT_MS,
        disableRedirects: true,
        webFetchExtra: { signal: controller.signal, redirect: "error" },
      });
      const elapsedMs = Math.round(performance.now() - inicio);
      if (response.status < 200 || response.status >= 300) {
        throw new ApiError(`El servidor respondió con HTTP ${response.status}.`, response.status);
      }
      return { status: response.status, data: response.data as unknown, elapsedMs };
    } catch (cause: unknown) {
      if (cause instanceof ApiError) throw cause;
      throw new ApiError("No se pudo completar la solicitud HTTPS. Comprueba internet y la disponibilidad del servidor; puede tratarse de un fallo de red, TLS, timeout o CORS en navegador.");
    } finally {
      // El timeout de interfaz no cancela la petición nativa. No permitir otra
      // hasta que Capacitor termine, aunque la alerta de timeout ya se mostrara.
      solicitudPendiente = false;
    }
  })();
  finalizacionPendiente = solicitud.then(() => undefined, () => undefined);

  try {
    const limite = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(new ApiError("Se agotó el tiempo de espera de 60 segundos. Render podría estar iniciando el servicio; vuelve a intentarlo más tarde."));
        controller.abort();
      }, TIMEOUT_MS);
    });
    return await Promise.race([solicitud, limite]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function checkApiConnectivity(): Promise<{ status: number; elapsedMs: number }> {
  const response = await requestApi({ method: "GET", path: "/openapi.json" });
  if (response.status !== 200) {
    throw new ApiError("La comprobación requiere una respuesta HTTP 200.", response.status);
  }
  let document: unknown = response.data;
  if (typeof document === "string") {
    try {
      document = JSON.parse(document) as unknown;
    } catch {
      throw new ApiError("La respuesta no contiene JSON válido.", response.status);
    }
  }
  if (!isObject(document) || typeof document.openapi !== "string"
    || !/^3\.\d+\.\d+(?:[-+].*)?$/.test(document.openapi)
    || !isObject(document.info) || typeof document.info.title !== "string"
    || !document.info.title.trim() || typeof document.info.version !== "string"
    || !document.info.version.trim() || !isObject(document.paths)) {
    throw new ApiError("La respuesta no tiene la estructura esperada de un documento OpenAPI 3.", response.status);
  }
  for (const [path, methods] of [
    ["/entrenamiento", ["get", "post"]],
    ["/prediccion", ["get", "post"]],
    ["/prediccion/{id}", ["get"]],
  ] as const) {
    const route = document.paths[path];
    if (!isObject(route) || !methods.every((method) => {
      const operation = route[method];
      return isObject(operation) && isObject(operation.responses);
    })) {
      throw new ApiError(`No se encontraron las operaciones esperadas para ${path} en OpenAPI.`, response.status);
    }
  }
  return { status: response.status, elapsedMs: response.elapsedMs };
}
