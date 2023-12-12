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
    'document.body.innerHTML',
    (res: string) => {
      const dom = htmlToDom(res);
      const microAppHierarchy = buildMicroAppHierarchy(dom);
      const treeData = objectToArray(microAppHierarchy, mapping);
      resolve(treeData);
    },
  );
});

const htmlToDom = (htmlContent: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  return doc.body; // 使用解析后的document的body作为起点
};

const getElementAttributes = (element: any) => {
  const attributes = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }
  return attributes;
};

const buildMicroAppHierarchy = (node: any): any => {
  let hierarchy = {};
  const reg = /^micro-app?-?.+(?<!(head|body))$/u;
  node.childNodes.forEach((childNode: any) => {
    if (childNode.nodeType === Node.ELEMENT_NODE) {
      if (reg.test(childNode.tagName.toLowerCase())) {
        const childHierarchy = buildMicroAppHierarchy(childNode);
        const name = childNode.getAttribute('name') || 'unnamed';
        hierarchy[name] = {
          attributes: getElementAttributes(childNode),
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
        para[oneKey] = attributes[mapping[oneKey]] ?? mapping[oneKey];
      }
    }
    if (value.hasChildren) {
      para.children = objectToArray(value.children, mapping);
    }
    result.push(para);
  }
  return result;
};
