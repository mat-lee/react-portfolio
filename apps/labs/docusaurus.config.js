// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Lab Notes',
  tagline: 'Interactive explorations by Matthew Lee',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://labs.codebymatthewlee.com',
  baseUrl: '/',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/', // Serve docs at root
          sidebarPath: './sidebars.js',
          sidebarCollapsible: true,
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  plugins: [
    function resolveWorkspacePackages() {
      return {
        name: 'resolve-workspace-packages',
        configureWebpack() {
          return {
            resolve: {
              alias: {
                '@portfolio/demos': path.resolve(__dirname, '../../packages/demos/src'),
              },
            },
          };
        },
        configurePostCss(postcssOptions) {
          postcssOptions.plugins.push(require('@tailwindcss/postcss'));
          return postcssOptions;
        },
      };
    },
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Lab Notes',
        items: [
          {
            href: 'https://codebymatthewlee.com',
            label: 'Portfolio',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'light',
        copyright: `Matthew Lee`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
