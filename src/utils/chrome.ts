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
