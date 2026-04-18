// src/lib/api.ts
const BASE_URL = "https://sift-stank-chair.ngrok-free.dev";

export async function getPrice() {
  const res = await fetch(`${BASE_URL}/price`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("API failed");

  return res.json();
}