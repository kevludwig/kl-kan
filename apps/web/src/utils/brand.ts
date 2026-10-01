import { env } from "next-runtime-env";

export const DEFAULT_APP_NAME = "kan.bn";

const optionalEnv = (name: string) => {
  const value = env(name);
  return value && value.length > 0 ? value : undefined;
};

export const getAppName = () =>
  optionalEnv("NEXT_PUBLIC_APP_NAME") ?? DEFAULT_APP_NAME;

export const getLogoUrls = () => {
  const light = optionalEnv("NEXT_PUBLIC_LOGO_URL");
  const dark = optionalEnv("NEXT_PUBLIC_LOGO_DARK_URL") ?? light;
  return { light, dark };
};

/** Replaces the default "| kan.bn" suffix of page titles with the app name. */
export const brandTitle = (title: string) =>
  title.replace(/kan\.bn$/, getAppName());

export const getSupportUrl = () =>
  optionalEnv("NEXT_PUBLIC_SUPPORT_URL") ?? "mailto:support@kan.bn";

/** Link to the source code of this instance (AGPL §13). */
export const getSourceUrl = () => optionalEnv("NEXT_PUBLIC_SOURCE_URL");

export const isWhiteLabel = () =>
  env("NEXT_PUBLIC_WHITE_LABEL_HIDE_POWERED_BY") === "true";
