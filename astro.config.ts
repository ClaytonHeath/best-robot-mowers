import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://bestlawnrobots.com",
  base: "/",
  trailingSlash: "always",
  integrations: [sitemap()],
});
