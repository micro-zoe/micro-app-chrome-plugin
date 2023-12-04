export const HEADER_TAB_LIST = [
  { name: 'ENV_VALUE_VIEWER', label: 'Environment' },
  { name: 'IFRAME_COMMUNICATE', label: 'Iframe Communicate' },
  { name: 'COMMUNICATE', label: 'Communicate' },
  { name: 'VIEW_APP', label: 'View' },
  { name: 'ROUTE_MATCH', label: 'Route' },
];

export const MICRO_APP_ENV_LIST: { name: string; describe: string;eval: string }[] = [
  { name: '__MICRO_APP_ENVIRONMENT__', describe: '判断应用是否在微前端环境中', eval: 'window.__MICRO_APP_PROXY_WINDOW__?.__MICRO_APP_ENVIRONMENT__||window.__MICRO_APP_ENVIRONMENT__' },
  { name: '__MICRO_APP_VERSION__', describe: '微前端版本号', eval: 'document.querySelector("micro-app")?.version' },
  { name: '__MICRO_APP_NAME__', describe: '应用名称', eval: 'window.__MICRO_APP_PROXY_WINDOW__?.__MICRO_APP_NAME__||window.__MICRO_APP_NAME__' },
  { name: '__MICRO_APP_PUBLIC_PATH__', describe: '子应用的静态资源前缀', eval: 'window.__MICRO_APP_PROXY_WINDOW__?.__MICRO_APP_PUBLIC_PATH__||window.__MICRO_APP_PUBLIC_PATH__' },
  { name: '__MICRO_APP_BASE_ROUTE__', describe: '子应用的基础路由', eval: 'window.__MICRO_APP_PROXY_WINDOW__?.__MICRO_APP_ENVIRONMENT__||window.__MICRO_APP_ENVIRONMENT__' },
];
