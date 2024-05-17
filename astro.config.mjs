import {defineConfig} from 'astro/config';
import icon from 'astro-icon';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [icon(), mdx()],
  site: 'https://jstncno.github.io',
  base: 'chaos-garden',
  output: 'static',
  build: { assets: 'astro' },
});