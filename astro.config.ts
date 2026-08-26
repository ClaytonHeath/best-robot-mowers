import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Placeholder GitHub Pages URL until a custom domain is attached.
// `site` is the origin; `base` is the repo path GitHub Pages serves from.
export default defineConfig({
  site: "https://claytonheath.github.io",
  base: "/best-robot-mowers",
  trailingSlash: "always",
  integrations: [sitemap()],
});
