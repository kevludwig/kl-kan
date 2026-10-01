import { createLogger } from "@kan/logger";

const log = createLogger("email");

const GRAPH_SCOPE = "https://graph.microsoft.com/.default";
const TOKEN_EXPIRY_MARGIN_MS = 60_000;

interface GraphCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export function isGraphEmailEnabled() {
  return process.env.EMAIL_PROVIDER?.toLowerCase() === "graph";
}

function getCredentials(): GraphCredentials {
  const tenantId = process.env.EMAIL_GRAPH_TENANT_ID;
  const clientId =
    process.env.EMAIL_GRAPH_CLIENT_ID ?? process.env.MICROSOFT_CLIENT_ID;
  const clientSecret =
    process.env.EMAIL_GRAPH_CLIENT_SECRET ??
    process.env.MICROSOFT_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Graph email requires EMAIL_GRAPH_TENANT_ID and client credentials (EMAIL_GRAPH_CLIENT_ID/SECRET or MICROSOFT_CLIENT_ID/SECRET)",
    );
  }

  return { tenantId, clientId, clientSecret };
}

async function getAccessToken(credentials: GraphCredentials) {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(credentials.tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        scope: GRAPH_SCOPE,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get Graph access token: ${response.status} ${await response.text()}`,
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - TOKEN_EXPIRY_MARGIN_MS,
  };

  return cachedToken.value;
}

/** Parses `Name <address@example.com>` or a bare address. */
export function parseSender(from: string) {
  const match = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(from);
  if (match?.[2]) {
    const name = match[1]?.trim();
    return { address: match[2].trim(), name: name ? name : undefined };
  }
  return { address: from.trim(), name: undefined };
}

export async function sendGraphEmail(options: {
  from: string;
  to: string;
  subject: string;
  html: string;
}) {
  const credentials = getCredentials();
  const sender = parseSender(options.from);
  const token = await getAccessToken(credentials);

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender.address)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: options.subject,
          body: { contentType: "HTML", content: options.html },
          from: { emailAddress: sender },
          toRecipients: [{ emailAddress: { address: options.to } }],
        },
        saveToSentItems: false,
      }),
    },
  );

  if (response.status !== 202) {
    if (response.status === 401) cachedToken = null;
    throw new Error(
      `Graph sendMail failed: ${response.status} ${await response.text()}`,
    );
  }

  log.debug(
    { to: options.to, from: sender.address },
    "Graph sendMail accepted",
  );
}
