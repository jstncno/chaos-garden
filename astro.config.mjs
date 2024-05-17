import {defineConfig} from 'astro/config';
import icon from 'astro-icon';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [icon(), mdx()],
  // Deploy to GitHub Pages
  // https://docs.astro.build/en/guides/deploy/github/
  site: 'https://jstncno.github.io',
});