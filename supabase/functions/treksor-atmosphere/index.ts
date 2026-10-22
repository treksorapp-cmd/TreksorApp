import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const PROJECT_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const db = createClient(PROJECT_URL, SERVICE_KEY, { auth: { persistSession: false } });
const INTERVAL_MS = 72 * 60 * 60 * 1000;
const BUCKET = "treksor-atmosphere";
const themes = [
  "a solitary alpine ridge above a sea of clouds at first light",
  "a vast dark pine forest with a delicate shaft of amber sunrise",
  "an austere black volcanic coastline with distant gold horizon",
  "a quiet desert of charcoal sand dunes under a muted dawn",
  "an atmospheric mountain lake reflecting distant rocky peaks",
  "a dramatic canyon in deep shadow with subtle warm rim lighting",
  "a remote trail climbing through misty highlands at dawn",
  "a minimalist silhouette of distant snow-covered mountain ranges"
];
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  const token = req.headers.get("x-atmosphere-cron-token") ?? "";
  if (token.length < 32 || !SERVICE_KEY) return json(401, { error: "Unauthorized" });
  const { data: verified, error: verifyError } = await db.rpc("verify_atmosphere_cron", { candidate: token });
  if (verifyError || verified !== true) return json(401, { error: "Unauthorized" });
  if (!OPENAI_KEY) return json(503, { error: "Image provider not configured" });

  const { data: latest, error: lookupError } = await db.from("atmosphere_images")
    .select("id,published_at").order("published_at", { ascending: false }).limit(1).maybeSingle();
  if (lookupError) return json(503, { error: "Unable to check current atmosphere" });
  if (latest && Date.now() - new Date(latest.published_at).getTime() < INTERVAL_MS) {
    return json(200, { status: "current", image_id: latest.id });
  }

  const rotation = Math.floor(Date.now() / INTERVAL_MS);
  const theme = themes[rotation % themes.length];
  const prompt = "Premium editorial landscape photography for TREKSOR, an elite wellbeing and outdoor performance brand. " +
    theme + ". Portrait 2:3 composition, deep charcoal blacks, near-black shadow detail, restrained antique gold highlights, " +
    "cinematic atmospheric depth, realistic fine-grain photography, tasteful and understated, subtle subject in upper two thirds, " +
    "dark quiet lower third for white interface typography. No people, no logos, no text, no symbols, no typography, " +
    "no graphic frames, no neon, no oversaturation. Extremely elegant dark photographic art direction.";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 110000);
  let imageResult: Response;
  try {
    imageResult = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "authorization": "Bearer " + OPENAI_KEY, "content-type": "application/json" },
      body: JSON.stringify({ model: "gpt-image-1-mini", prompt, size: "1024x1536", quality: "medium", n: 1 }),
      signal: controller.signal
    });
  } catch (error) {
    console.error("Atmosphere provider network error", error instanceof Error ? error.name : "unknown");
    return json(502, { error: "Image provider unavailable" });
  } finally { clearTimeout(timeout); }

  if (!imageResult.ok) {
    let code = "unknown";
    try { const issue = await imageResult.json(); code = issue?.error?.code ?? "unknown"; } catch {}
    console.error("Atmosphere provider error", { status: imageResult.status, code });
    return json(502, { error: "Image generation failed", provider_status: imageResult.status, provider_code: code });
  }
  const payload = await imageResult.json();
  const base64 = payload?.data?.[0]?.b64_json;
  if (typeof base64 !== "string" || !base64) return json(502, { error: "No image returned" });
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

  const path = "home/" + new Date().toISOString().slice(0,10) + "-" + crypto.randomUUID() + ".png";
  const { error: uploadError } = await db.storage.from(BUCKET).upload(path, bytes, {
    contentType: "image/png", cacheControl: "2592000", upsert: false
  });
  if (uploadError) { console.error("Atmosphere upload failed", uploadError.message); return json(503, { error: "Unable to publish image" }); }

  const { data: url } = db.storage.from(BUCKET).getPublicUrl(path);
  const { data: inserted, error: saveError } = await db.from("atmosphere_images")
    .insert({ storage_path: path, public_url: url.publicUrl, prompt })
    .select("id").single();
  if (saveError || !inserted) { console.error("Atmosphere metadata failed", saveError?.message); return json(503, { error: "Unable to publish image metadata" }); }
  return json(200, { status: "published", image_id: inserted.id });
});
