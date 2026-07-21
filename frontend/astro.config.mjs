// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://bodhic.app',
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [react(), sitemap()]
});