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

const htmlToDom = (htmlContent: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  return doc.body; // 使用解析后的document的body作为起点
}

const getElementAttributes = (element) => {
  const attributes = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }
  return attributes;
}

const buildMicroAppHierarchy = (node: any): any => {
  let hierarchy = {};
  const reg = /^micro-app?-?.+(?<!(head|body))$/u;
  node.childNodes.forEach((childNode) => {
    if (childNode.nodeType === Node.ELEMENT_NODE) {
      if (reg.test(childNode.tagName.toLowerCase())) {
        let childHierarchy = buildMicroAppHierarchy(childNode);
        let name = childNode.getAttribute('name') || 'unnamed';
        hierarchy[name] = {
          attributes: getElementAttributes(childNode),
          hasChildren: JSON.stringify(childHierarchy) !== '{}',
          children: childHierarchy
        };
      } else {
        hierarchy = {
          ...hierarchy,
          ...buildMicroAppHierarchy(childNode)
        }
      }
    }
  });
  return hierarchy;
};


export const getMicroAppLevel = (mapping = {}): Promise<any> => {
  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(
      `document.body.innerHTML`,
      (res: string) => {
        const dom = htmlToDom(res);
        const microAppHierarchy = buildMicroAppHierarchy(dom);
        console.log('microAppHierarchy', microAppHierarchy);
        const treeData = objectToArray(microAppHierarchy, mapping);
        resolve(treeData);
      },
    );
  })
}

const objectToArray = (obj, mapping) => {
  let result = [];
  for (let key in obj) {
    let value = obj[key];
    let para = {
      name: value.attributes.name,
      children: []
    }
    if (mapping && JSON.stringify(mapping) !== '{}') {
      const attributes = value.attributes;
      for (let oneKey of Object.keys(mapping)) {
        para[oneKey] = attributes[mapping[oneKey]];
      }
    }
    if (value.hasChildren) {
      para.children = objectToArray(value.children, mapping);
    }
    result.push(para);
  }
  return result;
}

