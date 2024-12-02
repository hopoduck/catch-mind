import proxyflare from "@flaregun-net/proxyflare-for-pages";
import { Route } from "@flaregun-net/proxyflare-for-pages/build/types";

interface EnvContext {
  readonly VITE_GA_ID: string;
  readonly VITE_CLOUDFLARE_URL: string;
  readonly VITE_API_URL: string;
}

// `PagesFunction` is from @cloudflare/workers-types
export const onRequest: PagesFunction<EnvContext>[] = [
  (context) => {
    const routes: Route[] = [
      {
        from: {
          pattern: `${context.env.VITE_CLOUDFLARE_URL}/api/*`,
          alsoMatchWWWSubdomain: true,
        },
        to: { url: `${context.env.VITE_API_URL}/api` },
      },
    ];

    return proxyflare({
      config: {
        global: { debug: true },
        routes,
      },
    })(context);
  },
  // other Pages plugins and middleware
];
