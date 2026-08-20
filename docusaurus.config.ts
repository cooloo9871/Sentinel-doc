import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'K8s Sentinel',
  tagline: '以 Cilium 與 Tetragon 打造的 Kubernetes 安全管理平台：執行期防護、網路策略、准入控制與事件應變',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  // GitHub Pages（Organization site）：https://sentineldoc.github.io
  url: 'https://sentineldoc.github.io',
  baseUrl: '/',
  organizationName: 'sentineldoc',
  projectName: 'sentineldoc.github.io',
  deploymentBranch: 'main',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'zh-TW',
    locales: ['zh-TW', 'en'],
    localeConfigs: {
      'zh-TW': { label: '繁體中文' },
      en: { label: 'English' },
    },
  },

  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          exclude: ['**/superpowers/**'],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/sentinel-social-card.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'K8s Sentinel',
      logo: {
        alt: 'K8s Sentinel',
        src: 'img/sentinel-icon.svg',
        srcDark: 'img/sentinel-icon-dark.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'sentinelSidebar',
          position: 'left',
          label: '文件',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/cooloo9871/K8s_Sentinel',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文件',
          items: [
            {label: '快速開始', to: '/'},
            {label: '安裝與部署', to: '/installation/'},
            {label: '功能操作教學', to: '/features/dashboard'},
          ],
        },
        {
          title: '相關連結',
          items: [
            {label: 'GitHub', href: 'https://github.com/cooloo9871/K8s_Sentinel'},
            {label: 'Cilium Tetragon', href: 'https://tetragon.io/'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} K8s Sentinel. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'yaml', 'typescript', 'go'],
    },
    mermaid: {
      theme: {light: 'default', dark: 'dark'},
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
