import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  sentinelSidebar: [
    {
      type: 'category',
      label: '開始使用',
      collapsed: false,
      items: ['intro', 'architecture'],
    },
    {
      type: 'category',
      label: '安裝與部署',
      collapsed: false,
      items: [
        'prerequisites',
        'installation/index',
        'installation/job-install',
        'installation/script-install',
      ],
    },
    {
      type: 'category',
      label: '存取 UI',
      collapsed: false,
      items: ['access/port-forward', 'access/ingress'],
    },
    {
      type: 'category',
      label: '功能操作教學',
      collapsed: false,
      items: [
        'features/dashboard',
        'features/tracing-policy',
        'features/form-editor',
        'features/yaml-editor',
        'features/execution-mode',
        'features/behavior-discovery',
        'features/templates',
        'features/notifications',
        'features/namespace-view',
      ],
    },
    'uninstall',
    'troubleshooting',
  ],
};

export default sidebars;
