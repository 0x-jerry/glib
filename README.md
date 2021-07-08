# Gem Lib

一些常用函数，还有一些常用命令行工具

## 安装

```sh
yarn add @exyz/glib
```

## 命令行工具

- release: 发布新版本。自动测试，构建，更新版本并推送到 GitHub。

### 配置文件

在项目中添加配置文件 `glib.config.js` 即可，具体格式，请参考 [UserOption](./src/cli/index.ts) 类型。
示例：

```js
/**
 * @type {import('@exyz/glib').UserOption}
 */
const conf = {
  release: {
    async afterDone(ctx) {
      ctx.info('Publishing to npm...')
      // Do something
      await ctx.run('cmd', ['param'])
    }
  }
}

module.exports = conf
```

执行顺序：

1. test: 检测并执行 package.json 的 test 命令
2. beforeBuild: 检测并执行 配置文件 `glib.config.js` 中的 beforeBuild 脚本
3. build: 检测并执行 package.json 中的 build 脚本
4. afterBuild: 检测并执行 配置文件 `glib.config.js` 中的 afterBuild 脚本
5. updateVersion: 更新 package.json 中 version 字段
6. changelog: 检测并执行 package.json 中的 changelog 脚本
7. commit: 提交 commit
8. push: 推送到远程 Github
9. publishToNpm: 执行 `yarn publish --new-version ${version}`，默认跳过这个步骤
10. afterDone: 检测并执行 配置文件 `glib.config.js` 中的 afterDone 脚本
