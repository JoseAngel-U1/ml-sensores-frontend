const DEFAULT_API_BASE_URL = "https://ml-sensores-api.onrender.com";

export function getApiUrl(path: string): string {
  const configured: unknown = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  if (typeof configured !== "string" || !configured.trim()) {
    throw new Error("VITE_API_BASE_URL debe contener una URL HTTPS.");
  }
  let base: URL;
  try {
    base = new URL(configured.trim());
  } catch {
    throw new Error("VITE_API_BASE_URL no contiene una URL válida.");
  }
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash) {
    throw new Error("La URL de la API debe usar HTTPS, sin credenciales, parámetros ni fragmentos.");
  }
  if (!/^\/[a-zA-Z0-9_/-]+(?:\.[a-zA-Z0-9]+)?$/.test(path) || path.includes("..")) {
    throw new Error("La ruta de la API no es válida.");
  }
  base.pathname = `${base.pathname.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  return base.toString();
}
