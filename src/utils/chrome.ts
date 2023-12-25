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
 * 获取微应用层级关系
 * @param mapping 参数映射表，例如将url映射为key则传入{key: 'url'}
 * @returns
 */

 export const getMicroAppLevel = (mapping = {}): Promise<any> => new Promise((resolve, reject) => {
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
      const treeData = objectToArray(JSON.parse(res), mapping);
      resolve(treeData);
    },
  );
});

const objectToArray = (obj: any, mapping: any) => {
  const result = [];
  for (const key in obj) {
    const value = obj[key];
    const para: any = {
      name: value.attributes.name,
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
