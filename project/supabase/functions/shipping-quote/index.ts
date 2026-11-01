import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

if (Deno.env.get("DENO_REGION") === undefined && false) {
  // noop
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { zip, subtotal, items } = body ?? {};

    if (!zip || typeof zip !== "string") {
      return new Response(JSON.stringify({ error: "CEP de destino é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: settings, error } = await supabase
      .from("store_settings")
      .select("origin_zip, default_shipping_price, free_shipping_threshold")
      .limit(1)
      .single();

    if (error || !settings) {
      return new Response(JSON.stringify({ error: "Configuração de frete indisponível." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const basePrice = settings.default_shipping_price ?? 29.9;
    const freeThreshold = settings.free_shipping_threshold;
    const orderSubtotal = typeof subtotal === "number" ? subtotal : 0;
    const itemCount = Array.isArray(items) ? items.length : 1;

    const isFree = freeThreshold !== null && orderSubtotal >= freeThreshold;
    const price = isFree ? 0 : basePrice + (itemCount > 1 ? (itemCount - 1) * 5 : 0);

    const options = [
      {
        id: "standard",
        method: "Standard",
        price,
        days: 7,
        carrier: "Correios",
      },
      {
        id: "express",
        method: "Express",
        price: isFree ? 0 : basePrice + 25,
        days: 3,
        carrier: "Sedex",
      },
    ];

    return new Response(JSON.stringify({ options }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
