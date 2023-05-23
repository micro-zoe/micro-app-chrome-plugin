/**
 * This file is part of the jd-mkt5 launch.
 * @link     : https://ace.jd.com/
 * @author   : Emil Zhai (root@derzh.com)
 * @modifier : Emil Zhai (root@derzh.com)
 * @copyright: Copyright (c) 2020 JD Network Technology Co., Ltd.
 */
/// <reference types="chrome"/>

declare global {
  interface Window {
    __MICRO_APP_EXTENSION_URL_PROTOCOL__?: string;
  }
}
