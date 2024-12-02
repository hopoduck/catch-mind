import proxyflare from "@flaregun-net/proxyflare-for-pages";
import { Route } from "@flaregun-net/proxyflare-for-pages/build/types";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      readonly VITE_GA_ID: string;
      readonly VITE_CLOUDFLARE_URL: string;
      readonly VITE_API_URL: string;
    }
  }
}

const routes: Route[] = [
  {
    from: {
      pattern: `${process.env.VITE_CLOUDFLARE_URL}/api/*`,
      alsoMatchWWWSubdomain: true,
    },
    to: { url: `${process.env.VITE_API_URL}/api` },
  },
];

// `PagesFunction` is from @cloudflare/workers-types
export const onRequest: PagesFunction[] = [
  (context) =>
    proxyflare({
      config: {
        global: { debug: true },
        routes,
      },
    })(context),
  // other Pages plugins and middleware
];
