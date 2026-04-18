// src/lib/api.ts

// Finding #09 — use env var instead of hardcoded ngrok URL; default to localhost for dev.
const BASE_URL =
  process.env.NEXT_PUBLIC_PYTHON_API_URL ?? "http://localhost:8000";

export async function getPrice() {
  // Finding: add AbortController timeout (5 s) to prevent indefinite hangs
  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), 5000);

  try {
    const res = await fetch(`${BASE_URL}/price`, {
      cache: "no-store",
      signal: ctrl.signal,
    });

    if (!res.ok) throw new Error("API failed");

    return res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}