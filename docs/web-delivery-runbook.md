# Aggie速记英语网页版交付清单（直接抄）

## 目标
先跑通网页原型验收，不做原生壳体、数据库和真实 AI 接口。

## 1) 开发环境首次启动

```bash
cd /Users/mason/英语系统
npm install
npm run web:dev
```

- 打开 `http://localhost:5173`
- 用手机同网段访问：`http://192.168.x.x:5173`

## 2) 验收（按页面验收清单）

- 看见：首页内容完整、不空白
- 角色切换 5 个角色都能点击并切换
- 创始人/老师/家长/学生/平台核心功能可见且按钮可点击
- 手机宽度下不出现横向滚动条

清单入口：`docs/web-delivery-checklist.md`

## 3) 生产包输出

```bash
npm run web:deliver
```

- 生成 `dist` 目录（用于交付）

## 4) 临时部署到 Cloudflare Pages（如需）

```bash
cd /Users/mason/英语系统
npm run web:deliver
```

部署前先按运行时清单逐项核对：

- [CLOUDFLARE_DEPLOYMENT.md](/Users/mason/英语系统/docs/CLOUDFLARE_DEPLOYMENT.md)

```bash

# 方式A（推荐）：已登录 wrangler 的机器
npm run cf:deploy

# 方式B（无交互环境）：先写入 token 再执行
export CLOUDFLARE_API_TOKEN=<你的 API Token>
npm run cf:deploy
```

> 如果没有 token，可先执行 `npx wrangler login` 或到 Cloudflare 后台创建 API Token（Pages:Edit）。

> 本仓库默认 `stack` 脚本使用 `8787` 端口；如你手工运行 `wrangler pages dev`，其默认端口是 `8788`。

发布前推荐先跑：

```bash
cd /Users/mason/英语系统
npm run stack:verify          # 启动（含 API）+ 一键自检
```

## 4.1 端口与本地预览

`wrangler pages dev` 默认会占用 8788，若本机冲突可改端口：

```bash
VITE_DATA_SOURCE=api npm run cf:dev -- --port 8790
```

## 4.2 函数联调

```bash
npm run build:web
npx wrangler pages dev dist --port 8790
```

> 本地 API 健康检查：`http://127.0.0.1:8788/api/v1/health`
> 如果你改了端口，请把 8788 改成你实际端口（例如 8790）。

例如：
- 健康检查：`http://127.0.0.1:8790/api/v1/health`
- 启动接口：`http://127.0.0.1:8790/api/v1/bootstrap?role=founder`
- 演示登录：`http://127.0.0.1:8790/api/v1/auth/login`，Body：`{ "role": "founder" }`

## 5) 交付包产物（`npm run web:ship`）

- 交付目录：`delivery/web/StarMate-English-YYYYMMDD_HHMMSS/`
- 含 `dist` 对应静态产物（直接发布）
- 附件文件：
  - `.delivery-note.txt`
  - `验收签字单-待填写.md`
  - `README.txt`
  - `delivery-docs/`（验收清单、截图引导、需求映射、签字模板、发送稿）

建议：先发 `delivery-docs/web-delivery-ready-to-send.md` 给对方对齐交付范围，再按以下文件做验收勾选。

你可直接把 `delivery/web/latest/` 整包发给对方，内部会自动指向最新版本。

## 6) 什么时候再开壳

- 网页验收通过后，再执行 `npm run mobile:*` 相关命令
- iOS/Android/小程序为下一阶段
- 当前环境验收：
  - iOS：`npm run mobile:open:ios` 已可打开工程；`npm run mobile:build:ios` 需要先配置 Apple 开发者签名 Team 后方可出包。
  - Android：`npm run mobile:open:android` 需要本机已安装 Android Studio；`npm run mobile:build:android` 还需 Java Runtime（建议 JDK 17）。
