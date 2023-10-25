/**
 * Micro app information for dev tools
 */
export interface DevToolsMicroAppInfo {
  env: {
    __MICRO_APP_ENVIRONMENT__: boolean;
    __MICRO_APP_NAME__: string;
    __MICRO_APP_PUBLIC_PATH__: string;
    __MICRO_APP_BASE_ROUTE__: string;
    __MICRO_APP_BASE_APPLICATION__: boolean;
  };
}

/**
 * Shared data and methods cross dev tools components (light redux, main bus)
 */
export interface DevToolsInfo {
  currentMicroApp?: DevToolsMicroAppInfo;
}

export interface MicroAppsInfos {
  title: string;
  key: string;
  children: MicroAppsInfos[];
}
