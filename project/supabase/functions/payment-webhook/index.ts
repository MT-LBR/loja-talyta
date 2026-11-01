import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const payload = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const gatewayPaymentId = payload?.id ?? payload?.payment_id ?? null;
    const orderId = payload?.order_id ?? payload?.external_reference ?? null;
    const status = payload?.status ?? payload?.payment_status ?? "pending";
    const amount = payload?.amount ?? payload?.transaction_amount ?? 0;
    const method = payload?.method ?? payload?.payment_method ?? null;
    const gateway = payload?.gateway ?? "external";

    if (!orderId) {
      return new Response(JSON.stringify({ error: "order_id ausente." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order } = await supabase
      .from("orders")
      .select("id, order_number")
      .eq("order_number", String(orderId))
      .maybeSingle();

    if (!order) {
      return new Response(JSON.stringify({ error: "Pedido não encontrado." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("payments").insert({
      order_id: order.id,
      gateway,
      gateway_payment_id: gatewayPaymentId ? String(gatewayPaymentId) : null,
      method,
      status: String(status),
      amount: typeof amount === "number" ? amount : 0,
      raw_payload: payload,
    });

    const statusMap: Record<string, string> = {
      approved: "paid",
      paid: "paid",
      authorized: "paid",
      captured: "paid",
      rejected: "cancelled",
      cancelled: "cancelled",
      refunded: "refunded",
    };

    const newStatus = statusMap[status] ?? null;
    if (newStatus) {
      await supabase
        .from("orders")
        .update({ status: newStatus, payment_status: newStatus })
        .eq("id", order.id);

      await supabase.from("order_status_history").insert({
        order_id: order.id,
        status: newStatus,
        note: `Pagamento ${status} via ${gateway}`,
      });
    }

    return new Response(JSON.stringify({ received: true, order: order.order_number }), {
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
