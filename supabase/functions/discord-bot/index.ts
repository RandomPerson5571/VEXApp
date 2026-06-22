import "@supabase/functions-js/edge-runtime.d.ts";
import nacl from "npm:tweetnacl";

const encoder = new TextEncoder();

function hexToBytes(hex: string) {
  const normalized = hex.trim();
  if (normalized.length % 2 !== 0) {
   throw new Error("Invalid hex value");
  }

  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < normalized.length; index += 2) {
   bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }

  return bytes;
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
   ...init,
   headers: {
     "content-type": "application/json",
     ...(init?.headers ?? {}),
   },
  });
}

function verifySignature(
  timestamp: string,
  body: string,
  signature: string,
  publicKey: string,
) {
  const message = encoder.encode(`${timestamp}${body}`);
  return nacl.sign.detached.verify(
   message,
   hexToBytes(signature),
   hexToBytes(publicKey),
  );
}

export default {
  async fetch(request: Request) {
   if (request.method !== "POST") {
     return new Response("Method Not Allowed", { status: 405 });
   }

   const publicKey = Deno.env.get("DISCORD_PUBLIC_KEY");
   if (!publicKey) {
     return new Response("Missing DISCORD_PUBLIC_KEY", { status: 500 });
   }

   const signature = request.headers.get("X-Signature-Ed25519");
   const timestamp = request.headers.get("X-Signature-Timestamp");
   if (!signature || !timestamp) {
     return new Response("Missing Discord signature headers", { status: 401 });
   }

   const body = await request.text();
   if (!verifySignature(timestamp, body, signature, publicKey)) {
     return new Response("Invalid request signature", { status: 401 });
   }

   const interaction = JSON.parse(body) as { type?: number; data?: { name?: string } };

   if (interaction.type === 1) {
     return jsonResponse({ type: 1 });
   }

   if (interaction.type === 2) {
     return jsonResponse({
       type: 4,
       data: {
         content: interaction.data?.name
           ? `Received /${interaction.data.name}.`
           : "Received Discord command.",
       },
     });
   }

   return jsonResponse({
     type: 4,
     data: { content: "Unsupported Discord interaction type." },
   });
  },
};
