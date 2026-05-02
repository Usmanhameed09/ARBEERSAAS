const browserApiBase = "/backend-api";

const envApiBase =
  process.env.NEXT_PUBLIC_API_BASE?.trim() ||
  process.env.NEXT_PUBLIC_BACKEND_API_BASE?.trim() ||
  "";

export const API_BASE = (envApiBase || browserApiBase).replace(/\/+$/, "");
