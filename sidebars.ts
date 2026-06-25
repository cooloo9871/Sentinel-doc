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
        'login',
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
        'features/network-topology',
        {
          type: 'category',
          label: 'Tracing Policy',
          collapsed: false,
          items: [
            'features/tracing-policy',
            'features/form-editor',
            'features/yaml-editor',
            'features/execution-mode',
            'features/behavior-discovery',
            'features/templates',
          ],
        },
        {
          type: 'category',
          label: 'Admission Policy',
          collapsed: false,
          items: [
            'features/admission-policy',
          ],
        },
        {
          type: 'category',
          label: '通知與事件',
          collapsed: false,
          items: [
            'features/notifications',
            'features/admission-events',
          ],
        },
        {
          type: 'category',
          label: '叢集資訊',
          collapsed: false,
          items: [
            'features/namespace-view',
          ],
        },
        {
          type: 'category',
          label: '系統設定',
          collapsed: false,
          items: [
            'features/users',
            'features/alerts',
            'features/syslog',
            'features/event-retention',
          ],
        },
      ],
    },
    'uninstall',
    'troubleshooting',
  ],
};

export default sidebars;
