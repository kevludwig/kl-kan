import Head from "next/head";

import { brandTitle } from "~/utils/brand";

export const PageHead = ({ title }: { title: string }) => {
  return (
    <Head>
      <title>{brandTitle(title)}</title>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1"
      />
      <link rel="manifest" href="/manifest.json" />
    </Head>
  );
};
