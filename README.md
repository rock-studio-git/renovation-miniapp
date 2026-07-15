# 装修管家（微信小程序 MVP）

面向装修小白的**预算与项目管理**工具。原生微信小程序 + TypeScript + TDesign，纯本地存储（MVP 无后端）。

> 本仓库为源码仓库：`node_modules`、微信编译产物（`.js`、`.js.map`）、`package-lock.json` 均已通过 `.gitignore` 排除，克隆后需本地 `npm install` + 开发者工具「构建 npm」还原运行环境。

## 技术栈

| 项目 | 说明 |
|------|------|
| 开发方式 | 微信小程序原生开发（非 Taro / uni-app） |
| 语言 | TypeScript（strict 模式，禁止 `any`） |
| UI 组件库 | TDesign Miniprogram（`tdesign-miniprogram`） |
| 类型提示 | `miniprogram-api-typings` |
| 数据存储 | 纯本地 Storage（`wx.getStorageSync` / `setStorageSync`） |
| 包管理 | npm + 微信开发者工具「构建 npm」 |

## 目录结构

```
renovation-miniapp/
├── project.config.json        # 小程序工程配置（miniprogramRoot: miniprogram/）
├── tsconfig.json              # TS 严格模式配置（就地编译，无 outDir）
├── package.json
├── miniprogram/               # 小程序代码根（开发者工具读取此目录）
│   ├── app.ts / app.json / app.wxss
│   ├── pages/                 # 13 个页面（首页/项目/预算/待办）
│   ├── components/            # 6 个自定义基础组件
│   ├── stores/                # 数据层：project / budget / todo store
│   ├── types/                 # 类型定义
│   └── utils/                 # 工具函数 + 纯函数计算引擎
└── tests/                     # vitest 单元/集成测试
```

## 一、克隆代码

### 方式 A：HTTPS（推荐，无需配置 SSH）

```bash
git clone https://github.com/rock-studio-git/renovation-miniapp.git
```

克隆后进入目录并安装依赖：

```bash
cd renovation-miniapp
npm install
```

### 方式 B：SSH

需先把**本地机器**的 SSH 公钥加入 GitHub 账户（`Settings → SSH and GPG keys`）：

```bash
git clone git@github.com:rock-studio-git/renovation-miniapp.git
```

> ⚠️ 注意：SSH 公钥是**按机器**登记的。沙箱里生成的钥匙只用于沙箱→GitHub 推送，和你本地克隆无关，本地需用自己的钥匙。

### 含中文 / 空格 / 括号的路径（如 iCloud 目录）

中文路径在 macOS 上**完全没问题**（原生 UTF-8）。真正要处理的是**空格和括号**，整段路径加英文双引号即可：

```bash
git clone https://github.com/rock-studio-git/renovation-miniapp.git \
  "/Users/liufeipeng/iCloud云盘（归档）/工作文档/Inbox/Project/2026年/多人项目asis/renovation-miniapp"
```

克隆后：

```bash
cd "/Users/liufeipeng/iCloud云盘（归档）/工作文档/Inbox/Project/2026年/多人项目asis/renovation-miniapp"
npm install
```

## 二、iCloud 云盘注意事项 ⚠️

若项目放在 iCloud 云盘，且系统开启了 **「优化 Mac 存储空间」**，不常用文件会被挪到云端、只留占位符，微信开发者工具可能读不到导致编译异常。建议：

- 对该文件夹 **右键 → 始终保留在此 Mac 上**；
- 或开发期放到本地非 iCloud 目录更稳妥。

本项目依赖（tdesign-miniprogram / typescript / vitest）均为纯 JS，无原生编译，中文 / 空格路径下 `npm install` 不会有问题。

## 三、微信开发者工具运行

1. **下载安装**：[微信开发者工具稳定版](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（Mac 按芯片选 `arm64` / `x64` 的 `.dmg`），首次打开用微信扫码登录。
2. **导入项目**：选**仓库根目录**（即包含 `project.config.json` 的文件夹），**不要**选 `miniprogram/` 子目录，否则找不到配置与 npm 关系。
3. **AppID**：保持 `touristappid`（游客模式，可本地预览，无需注册）；或点「测试号」自动生成。
4. **TS 编译**：工具按 `tsconfig.json` 把 `.ts` **就地编译**成同目录 `.js`（也可在终端跑 `npx tsc` 手动生成）。
5. **构建 npm（关键）**：顶部菜单「工具 → 构建 npm」，生成 `miniprogram/miniprogram_npm/`（TDesign 依赖所在）。若菜单灰掉，先到「详情 → 本地设置」勾选「启用 npm」。
6. **预览**：点「编译」在模拟器查看；点「预览」生成二维码用手机微信扫码真机查看。

### 常见排查

| 现象 | 原因 / 处理 |
|------|------------|
| TDesign 组件找不到 / 页面空白 | 未「构建 npm」→ 重做上方第 5 步 |
| 真机预览报错 | 确认 `project.config.json` 中 `"urlCheck": false`，且已构建 npm |
| TS 报错想自查 | 终端跑 `npm run typecheck` |

> 发布限制：`touristappid` 仅能本地预览，不能上传发布。要发布需在 [微信公众平台](https://mp.weixin.qq.com/) 注册小程序，拿到自己的 AppID 替换 `project.config.json` 中的 `appid`。

## 四、测试与质量门禁

```bash
npm test            # vitest 单元/集成测试（预算计算、待办排序引擎等）
npm run typecheck   # tsc 类型检查（strict 模式，0 错误为准）
```

- 预算计算引擎（`utils/budget-calculator.ts`）与待办排序引擎（`utils/todo-sorter.ts`）均含单元测试，预警规则覆盖 80% / 100% 边界矩阵。
- 代码提交前应确保 `tsc` 编译无错误。

## 五、开发约定速览

- 页面放 `miniprogram/pages/`，每个页面四件套：`.wxml` / `.ts` / `.wxss` / `.json`。
- 数据层按实体拆分（`project-store` / `budget-store` / `todo-store`），类型定义在 `types/`。
- 核心业务逻辑（预算统计、待办排序、预警判断）写成纯函数，便于单测。
- 列表 / 卡片必须处理空状态；金额统一人民币、保留两位小数，用 `money-display` 组件展示。
- 删除操作（项目 / 支出 / 分类）必须有二次确认弹窗。
- MVP 纪律：严格遵循 PRD，不做比价、采购、知识百科等高级功能。
