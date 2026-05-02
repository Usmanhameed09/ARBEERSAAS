const browserApiBase = "/backend-api";
const directBackendOriginDefault = "https://arberwebapp.arbernetwork.com";

const envApiBase =
  process.env.NEXT_PUBLIC_API_BASE?.trim() ||
  process.env.NEXT_PUBLIC_BACKEND_API_BASE?.trim() ||
  "";

export const API_BASE = (envApiBase || browserApiBase).replace(/\/+$/, "");

const envDirectBackendOrigin =
  process.env.NEXT_PUBLIC_DIRECT_BACKEND_ORIGIN?.trim() ||
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.trim() ||
  process.env.NEXT_PUBLIC_API_ORIGIN?.trim() ||
  "";

export const DIRECT_BACKEND_API_BASE = `${(envDirectBackendOrigin || directBackendOriginDefault).replace(/\/+$/, "")}/api`;
