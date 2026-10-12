import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "unavailable" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    console.error(JSON.stringify({ event: "recovery_lookup", status: "misconfigured" }));
    return json(503, { error: "unavailable" });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "invalid_email" });
  }

  const email = normalizeEmail(
    payload && typeof payload === "object" && "email" in payload
      ? (payload as { email?: unknown }).email
      : "",
  );

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return json(400, { error: "invalid_email" });
  }

  const pepper =
    Deno.env.get("RECOVERY_LOOKUP_PEPPER") ?? serviceKey;
  const ipHash = await sha256Hex(`ip:${pepper}:${clientIp(req)}`);
  const emailHash = await sha256Hex(`email:${pepper}:${email}`);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: consume, error: consumeError } = await admin.rpc(
    "lunyon_recovery_lookup_consume",
    {
      p_ip_hash: ipHash,
      p_email_hash: emailHash,
    },
  );

  if (consumeError) {
    console.error(JSON.stringify({ event: "recovery_lookup", status: "throttle_unavailable" }));
    return json(503, { error: "unavailable" });
  }

  if (consume === "limited") {
    console.info(JSON.stringify({ event: "recovery_lookup", status: "rate_limited" }));
    return json(429, { error: "rate_limited" });
  }

  const { data: registered, error: lookupError } = await admin.rpc(
    "lunyon_email_is_registered",
    { p_email: email },
  );

  if (lookupError || typeof registered !== "boolean") {
    console.error(JSON.stringify({ event: "recovery_lookup", status: "lookup_unavailable" }));
    return json(503, { error: "unavailable" });
  }

  console.info(
    JSON.stringify({
      event: "recovery_lookup",
      status: registered ? "registered" : "unregistered",
    }),
  );

  return json(200, { registered });
});
