# React Chrome Extension Boilerplate

> A react boilerplate for building chrome extension.

## Mounted with

| Package    | Version  |
| ---------- | -------- |
| Webpack    | 5.x      |
| TypeScript | 4.x      |
| ESLint     | 8.x      |
| PostCSS    | 8.x      |
| Less       | 4.x      |
| Node SASS  | 8.x      |
| Stylelint  | 14.x     |

## How to develop

1. Clone this repo.
2. Run `npm install`.
3. Start by `npm start`.
4. Open chrome extensions  [chrome://extensions](chrome://extensions/)
5. Click to load the extracted extension program and load the `dist` file in the project
6. Open a page that uses a micro-frontend, such as [https://yx.jd.com/material/#/product](https://yx.jd.com/material/#/product), open the page developer tool to see the micro-app chrome plugin.

![micro-app chrome plugin](https://img13.360buyimg.com/imagetools/jfs/t1/204489/4/31249/966189/63c4f9a3Fba5682db/c4de0349bf75941b.png)

7.If you want to modify the code, new branch based on `master` branch. 


> The plugin can be hot loaded and updated in real time during development

## How to build
1. Build by `npm run build`.

2. open [chrome://extensions](chrome://extensions) use by chrome
![扩展程序](https://img14.360buyimg.com/imagetools/jfs/t1/78583/12/20599/166447/646b53d7F726dcd82/917093999b2248e8.png)

3. found `dist.crx` change to `dist.zip`

## Tips

For WSL users, here's a trick you can develop in a linux sub system with hot reload, and preview in windows host system `Chrome` application:

1. In WSL

    ```sh
    npm start -- --distPath="/mnt/d/react-chrome-extension-boilerplate-dist"
    ```

2. In chrome: Load unpack extension from `D:/react-chrome-extension-boilerplate-dist`
