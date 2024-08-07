/* eslint-disable no-console */
/* eslint-disable no-useless-escape */
/**
 * Get cookies for specific URL
 * @param url URL
 * @returns Cookie list for specific URL
 */
export const getURLCookies = (url: string) => new Promise<chrome.cookies.Cookie[]>((resolve) => {
  const host = url.replace(/^https?:\/\//u, '').replace(/\/.*$/u, '');
  const path = url.replace(/^https?:\/\/[^/]+/u, '').replace(/\?.*$/u, '');
  chrome.cookies.getAll({},
    (cookies) => {
      resolve(cookies.filter(cookie =>
        (host === cookie.domain || (host.endsWith(cookie.domain) && cookie.sameSite !== 'strict'))
        && (cookie.path === path || cookie.path === '/')));
    });
});

/**
 * 微应用树形结构单条数据
 */
interface OneTreeData {
  [name: string]: {
    attributes: {
      [key: string]: unknown;
    };
    children: OneTreeData;
    hasChildren: boolean;
  };
}

export interface FinalTreeData {
  name: string;
  version?: string;
  [key: string]: unknown;
}

const objectToArray = (obj: OneTreeData, mapping: object): FinalTreeData[] => {
  const result: FinalTreeData[] = [];
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const para: {
      name: string;
      children: FinalTreeData[];
    } = {
      name: value.attributes.name as string,
      children: [],
    };
    if (mapping && JSON.stringify(mapping) !== '{}') {
      const attributes = value.attributes;
      for (const oneKey of Object.keys(mapping)) {
        para[oneKey] = attributes[mapping[oneKey]] ?? null;
      }
    }
    if (value.hasChildren) {
      para.children = objectToArray(value.children, mapping);
    }
    result.push(para);
  }
  return result;
};

/**
 * 从页面获取微应用层级结构
 * @param mapping 数据映射，需要获取的参数名
 * @returns 树形结构
 */
export const getMicroAppLevel = (mapping: object = {}): Promise<FinalTreeData[]> => new Promise<FinalTreeData[]>((resolve) => {
  chrome.devtools.inspectedWindow.eval(
    `JSON.stringify(
      function () {
          function buildMicroAppHierarchy(node = document.body) {
              let hierarchy = {};
              const reg = /^micro-app?-?.+(?<!(head|body))$/u;
              node.childNodes.forEach((childNode) => {
                  if (childNode.nodeType === Node.ELEMENT_NODE) {
                      if (reg.test(childNode.tagName.toLowerCase())) {
                          const childHierarchy = buildMicroAppHierarchy(childNode);
                          const name = childNode.getAttribute('name') || 'unnamed';
                          const version = childNode.version;
                          let router = {}
                          if (/^1\./.test(version)){
                              router = window.__MICRO_APP_PROXY_WINDOW__.microApp.router.current.get(name);
                          }
                          hierarchy[name] = {
                              attributes: {
                                  ...getElementAttributes(childNode),
                                  version,
                                  ...router,
                                  tagName: childNode.tagName.toLowerCase()
                              },
                              hasChildren: JSON.stringify(childHierarchy) !== '{}',
                              children: childHierarchy,
                          };
                      } else {
                          hierarchy = {
                              ...hierarchy,
                              ...buildMicroAppHierarchy(childNode),
                          };
                      }
                  }
              });
              return hierarchy;
          };
  
          function getElementAttributes(element) {
              const attributes = {};
              for (let i = 0; i < element.attributes.length; i++) {
                  const attr = element.attributes[i];
                  attributes[attr.name] = attr.value;
              }
              return attributes;
          };
  
          return buildMicroAppHierarchy();
      }()
  )`,
    (res: string) => {
      console.log('getMicroAppLevel', JSON.parse(res));
      const treeData = objectToArray(JSON.parse(res) as OneTreeData, mapping);
      resolve(treeData);
    },
  );
});
