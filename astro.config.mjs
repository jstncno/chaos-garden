import { defineConfig } from 'astro/config';
import mdx from "@astrojs/mdx";

import analogjsangular from "@analogjs/astro-angular";

// https://astro.build/config
export default defineConfig({
  integrations: [mdx(), analogjsangular()]
});