# 装修管家（微信小程序 MVP）

面向装修小白的**预算与项目管理**工具。原生微信小程序 + TypeScript + TDesign，纯本地存储（MVP 无后端）。

> TDesign 组件构建产物（`miniprogram/miniprogram_npm/`）已直接提交在仓库中，克隆后无需再跑「构建 npm」步骤，开发者工具导入即可编译预览。

## 技术栈

| 项目 | 说明 |
|------|------|
| 开发方式 | 微信小程序原生开发（非 Taro / uni-app） |
| 语言 | TypeScript（strict 模式，禁止 `any`） |
| UI 组件库 | TDesign Miniprogram（构建产物已入库，无需手动构建 npm） |
| 类型提示 | `miniprogram-api-typings` |
| 数据存储 | 纯本地 Storage（`wx.getStorageSync` / `setStorageSync`） |

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
│   ├── utils/                 # 工具函数 + 纯函数计算引擎
│   └── miniprogram_npm/       # TDesign 构建产物（已入库，无需手动构建）
└── tests/                     # vitest 单元/集成测试
```

## 快速开始

### 前置条件

- **Node.js** 18+（含 npm）：`brew install node` 或从 [nodejs.org](https://nodejs.org) 下载 LTS 版
- **微信开发者工具**：[下载稳定版](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（Mac 按芯片选 `arm64` / `x64`）

### 步骤

```bash
# 1. 克隆
git clone https://github.com/rock-studio-git/renovation-miniapp.git
cd renovation-miniapp

# 2. 安装依赖（仅开发/测试需要，开发者工具编译不依赖此步）
npm install

# 3. 编译 TS → JS（首次必须，后续开发者工具可自动编译）
npx tsc
```

然后在微信开发者工具中：

1. **导入项目** → 选**仓库根目录**（含 `project.config.json` 的文件夹，**不要**选 `miniprogram/` 子目录）
2. **AppID** → 选 **「测试号」**（扫码授权即可本地预览）
3. **编译** → 模拟器即可看到首页

> ⚠️ 不需要点「构建 npm」—— TDesign 构建产物已在仓库中。

### 含中文 / 空格 / 括号的路径（如 iCloud 目录）

中文路径在 macOS 上完全没问题（原生 UTF-8）。整段路径加英文双引号即可处理空格和括号：

```bash
git clone https://github.com/rock-studio-git/renovation-miniapp.git \
  "/path/with 中文和空格/renovation-miniapp"
```

## iCloud 云盘注意事项 ⚠️

若项目放在 iCloud 云盘且系统开了「优化 Mac 存储空间」，不常用文件会被挪到云端只留占位符，开发者工具可能读不到。建议：

- 对该文件夹 **右键 → 始终保留在此 Mac 上**；
- 或开发期放到本地非 iCloud 目录更稳妥。

## 常见排查

| 现象 | 原因 / 处理 |
|------|------------|
| 页面 JS 文件找不到 | 未编译 TS → 跑 `npx tsc` 或在开发者工具「详情 → 本地设置」勾选「启用 TypeScript 编译」 |
| 真机预览报错 | 确认 `project.config.json` 中 `"urlCheck": false` |
| TS 报错想自查 | 终端跑 `npm run typecheck` |
| npm 找不到 | 未装 Node.js → `brew install node` |

> 发布限制：测试号 AppID 仅能本地预览，不能上传发布。要发布需在 [微信公众平台](https://mp.weixin.qq.com/) 注册小程序，拿到自己的 AppID 替换 `project.config.json` 中的 `appid`。

## 测试与质量门禁

```bash
npm test            # vitest 单元/集成测试（40 用例：预算计算、待办排序引擎等）
npm run typecheck   # tsc 类型检查（strict 模式，0 错误为准）
```

- 预算计算引擎（`utils/budget-calculator.ts`）与待办排序引擎（`utils/todo-sorter.ts`）均含单元测试，预警规则覆盖 80% / 100% 边界矩阵。
- 代码提交前应确保 `tsc` 编译无错误。

## 开发约定速览

- 页面放 `miniprogram/pages/`，每个页面四件套：`.wxml` / `.ts` / `.wxss` / `.json`。
- 数据层按实体拆分（`project-store` / `budget-store` / `todo-store`），类型定义在 `types/`。
- 核心业务逻辑（预算统计、待办排序、预警判断）写成纯函数，便于单测。
- 列表 / 卡片必须处理空状态；金额统一人民币、保留两位小数，用 `money-display` 组件展示。
- 删除操作（项目 / 支出 / 分类）必须有二次确认弹窗。
- MVP 纪律：严格遵循 PRD，不做比价、采购、知识百科等高级功能。
