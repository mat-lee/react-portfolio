// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://labs.mat-lee.us',
  integrations: [mdx(), react()],
  server: { port: 3000 },
});
