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

## How to make a release

1. Open [https://github.com/micro-zoe/micro-app-chrome-plugin/releases](https://github.com/micro-zoe/micro-app-chrome-plugin/releases), click "Draft a new release" button.

2. Choose a tag or create a new tag. The versioning follows the [Semantic Versioning 2.0.0](https://semver.org/) specification for semantic versioning.

3. Fill in the version number as the title. Include the update details in the description.

4. Upload the artifacts of the current version as attachments.

5. Publish release.

6. Modify the download link in README.md to an attachment link.

## Tips

For WSL users, here's a trick you can develop in a linux sub system with hot reload, and preview in windows host system `Chrome` application:

1. In WSL

    ```sh
    npm start -- --distPath="/mnt/d/react-chrome-extension-boilerplate-dist"
    ```

2. In chrome: Load unpack extension from `D:/react-chrome-extension-boilerplate-dist`
