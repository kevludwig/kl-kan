import { createAuthEndpoint } from "better-auth/api";
import { socialProviderList } from "better-auth/social-providers";

// Tenant ID that Entra uses for personal Microsoft accounts (MSA)
const MICROSOFT_PERSONAL_ACCOUNT_TENANT_ID =
  "9188040d-6c67-4c5b-b112-36a304b66dad";
const MICROSOFT_MULTI_TENANT_AUTHORITIES = ["common", "organizations"];

/**
 * In multi-tenant mode any Entra tenant can assert an arbitrary `email` claim
 * ("nOAuth"). Only trust the email if Microsoft verified it: personal accounts,
 * or work accounts whose tenant owns the email domain (`xms_edov` optional claim).
 * Unverified emails are dropped so Better Auth rejects the sign-in.
 */
export function mapMicrosoftProfileToUser(
  profile: Record<string, unknown>,
  tenantId: string,
): { emailVerified: boolean; email?: string } {
  const edov = profile.xms_edov;
  const isVerified =
    profile.tid === MICROSOFT_PERSONAL_ACCOUNT_TENANT_ID ||
    edov === true ||
    edov === "true" ||
    edov === 1 ||
    edov === "1";

  if (
    !isVerified &&
    MICROSOFT_MULTI_TENANT_AUTHORITIES.includes(tenantId.toLowerCase())
  ) {
    return { emailVerified: false, email: "" };
  }

  return { emailVerified: isVerified };
}

export const configuredProviders = socialProviderList.reduce<
  Record<
    string,
    {
      clientId: string;
      clientSecret: string;
      appBundleIdentifier?: string;
      tenantId?: string;
      requireSelectAccount?: boolean;
      clientKey?: string;
      issuer?: string;
      // Google-specific optional hints
      hostedDomain?: string;
      hd?: string;
      disableProfilePhoto?: boolean;
      mapProfileToUser?: (
        profile: Record<string, unknown>,
      ) => ReturnType<typeof mapMicrosoftProfileToUser>;
    }
  >
>((acc, provider) => {
  const id = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
  const secret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
  if (id && id.length > 0 && secret && secret.length > 0) {
    acc[provider] = { clientId: id, clientSecret: secret };
  }
  if (
    provider === "apple" &&
    Object.keys(acc).includes("apple") &&
    acc[provider]
  ) {
    const bundleId =
      process.env[`${provider.toUpperCase()}_APP_BUNDLE_IDENTIFIER`];
    if (bundleId && bundleId.length > 0) {
      acc[provider].appBundleIdentifier = bundleId;
    }
  }
  if (
    provider === "gitlab" &&
    Object.keys(acc).includes("gitlab") &&
    acc[provider]
  ) {
    const issuer = process.env[`${provider.toUpperCase()}_ISSUER`];
    if (issuer && issuer.length > 0) {
      acc[provider].issuer = issuer;
    }
  }
  if (
    provider === "microsoft" &&
    Object.keys(acc).includes("microsoft") &&
    acc[provider]
  ) {
    const tenantId = process.env.MICROSOFT_TENANT_ID;
    const resolvedTenantId =
      tenantId && tenantId.length > 0 ? tenantId : "common";
    acc[provider].tenantId = resolvedTenantId;
    acc[provider].requireSelectAccount = true;
    // The photo is returned as a multi-KB data URI, which exceeds user.image
    // (varchar 255) and makes sign-up fail with unable_to_create_user.
    acc[provider].disableProfilePhoto = true;
    acc[provider].mapProfileToUser = (profile) =>
      mapMicrosoftProfileToUser(profile, resolvedTenantId);
  }
  // Add Google domain hint if allowed domains is configured
  if (
    provider === "google" &&
    Object.keys(acc).includes("google") &&
    acc[provider]
  ) {
    const allowed = process.env.BETTER_AUTH_ALLOWED_DOMAINS?.split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
    if (allowed && allowed.length > 0) {
      // Use the first domain as an authorization hint
      acc[provider].hostedDomain = allowed[0];
      acc[provider].hd = allowed[0];
    }
  }
  if (
    provider === "tiktok" &&
    Object.keys(acc).includes("tiktok") &&
    acc[provider]
  ) {
    const key = process.env[`${provider.toUpperCase()}_CLIENT_KEY`];
    if (key && key.length > 0) {
      acc[provider].clientKey = key;
    }
  }
  return acc;
}, {});

export const socialProvidersPlugin = () => ({
  id: "social-providers-plugin",
  endpoints: {
    getSocialProviders: createAuthEndpoint(
      "/social-providers",
      {
        method: "GET",
      },
      async (ctx) => {
        const providers = ctx.context.socialProviders.map((p) =>
          p.id.toLowerCase(),
        );
        return ctx.json(providers);
      },
    ),
  },
});
