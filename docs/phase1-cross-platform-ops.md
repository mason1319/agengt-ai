# StarMate English 第一阶段：跨端执行手册（可直接照抄）

> 本文给小白可执行的操作，不重写页面，只让一套前端适配 H5 / iOS / Android / 微信小程序。
> 说明：先做网页端验收，iOS/Android/小程序按阶段后置。

## 先确认这三项

- 本机已装：Node.js 18+、Git
- iOS 打包：Mac + Xcode + CocoaPods
- Android 打包：Android Studio + JDK 17（建议）

## 一、先把当前原型跑通（H5）

```bash
cd /Users/mason/\u661f\u4f34\u82f1\u8bed
npm install
npm run dev
```

- 浏览器建议同时测：
  - 电脑：`http://localhost:5173`
  - 手机：同一 Wi-Fi 下打开电脑内网 IP，例如 `http://192.168.x.x:5173`

## 二、把 H5 变为原生壳（Capacitor）

### 1）首次初始化壳体

```bash
npm run build:web
npm run mobile:sync
npm run mobile:bootstrap
```

说明：`mobile:sync` 会自动同步 `dist` 到 `ios`/`android` 目录。
若第一次缺少目录，会执行：

```bash
npx cap add ios
npx cap add android
```

然后再执行一次：

```bash
npm run mobile:sync
```

### 2）iOS 打开与调试

```bash
npm run mobile:open:ios
```

- 在 Xcode 中打开后：
  - 选择真机/模拟器
  - 检查签名（Team）
  - 点「Run」

### 3）Android 打开与调试

```bash
npm run mobile:open:android
```

- 在 Android Studio 中：
  - 同步 Gradle
  - 选择设备后 Run

### 4）常用发布命令

```bash
npm run mobile:run:ios
npm run mobile:run:android
npm run mobile:build:ios
npm run mobile:build:android
```

## 三、微信小程序接入策略

### 阶段 A（最快）：H5 小程序 web-view

1. Cloudflare Pages 上线 H5 域名（如 `https://xxx.pages.dev`）
2. 在微信小程序内创建 Webview 页面，地址使用该 H5 链接
3. 禁用跳转到外部域名的敏感交互；登录与权限先按“演示角色切换”运行
4. 通过 `manifest.webmanifest` 让站点有基础 PWA 元信息（已添加）

### 阶段 B（推荐）：跨端框架迁移

- 建议下一步用 Taro/uni-app 再封装同一套 API 契约
- 约定统一接口地址，保留 `src/config/appConfig.js` 作为前端文案与角色规则入口

## 四、验收动作（用户给的小白标准）

- 首页有展示（首屏不空白）
- 角色切换可见且都可点
- 手机 360/375/390/412 宽度下不出现横向滚动
- 老师端可见联系方式脱敏
- 平台端可见套餐到期/试用/月付年付/过期策略

## 五、后续维护（最省改动）

- 所有套餐与角色文案统一改在：`src/config/appConfig.js`
- 所有页面文案与样式统一改在：`src/seedData.js`、`src/styles.css`
- 如要接真实接口：只替换 `seedData.js` 里的本地模拟常量为 API fetch

## 六、常见问题（快速修复）

- iOS 白屏：先执行 `npm run mobile:prepare && npx cap sync`，再重装 app
- Android 登录失败：确认域名 HTTPS，白名单里已放行接口域名
- 真机键盘挡住输入：检查 `src/styles.css` 是否保留 `100dvh` 及移动端 `viewport-fit=cover`
