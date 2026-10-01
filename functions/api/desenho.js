import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

export async function onRequestPost(context) {
  // 1. Validar o corpo (400)
  let corpo;
  try {
    corpo = await context.request.json();
  } catch {
    return new Response("Corpo JSON inválido", {
      status: 400,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const numero = corpo?.numero;

  if (typeof numero !== "number" || !numeroValido(numero)) {
    return new Response("Número ausente, não inteiro ou fora do intervalo de 1 a 100", {
      status: 400,
      headers: { "Cache-Control": "no-store" }
    });
  }

  // 2. Validar o token (401)
  const authHeader = context.request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Token ausente", {
      status: 401,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const idToken = authHeader.slice("Bearer ".length).trim();

  if (!idToken) {
    return new Response("Token ausente", {
      status: 401,
      headers: { "Cache-Control": "no-store" }
    });
  }

  let tokenInfo;
  try {
    const verifyResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );

    if (!verifyResponse.ok) {
      return new Response("Token inválido ou expirado", {
        status: 401,
        headers: { "Cache-Control": "no-store" }
      });
    }

    tokenInfo = await verifyResponse.json();
  } catch {
    return new Response("Falha ao verificar o token", {
      status: 401,
      headers: { "Cache-Control": "no-store" }
    });
  }

  if (tokenInfo.aud !== context.env.GOOGLE_CLIENT_ID) {
    return new Response("Audiência do token inválida", {
      status: 401,
      headers: { "Cache-Control": "no-store" }
    });
  }

  if (tokenInfo.email_verified !== "true") {
    return new Response("E-mail não verificado", {
      status: 401,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const email = tokenInfo.email;

  // 3. Gerar o desenho assinado com o e-mail do token
  const svg = gerarDesenho(numero, email);

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST", "Cache-Control": "no-store" }
    });
  }
  return onRequestPost(context);
}
