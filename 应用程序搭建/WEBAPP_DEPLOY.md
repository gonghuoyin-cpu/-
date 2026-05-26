# 财醒 Web App 发布说明

这版已经整理成静态 Web App，可直接发布给用户测试。

## 文件结构

```text
index.html              应用入口
styles.css              页面样式
app.js                  业务逻辑
manifest.webmanifest    PWA 安装配置
sw.js                   离线缓存 Service Worker
assets/logo.svg         应用图标
assets/maskable-logo.svg PWA maskable 图标
vercel.json             Vercel 静态托管配置
netlify.toml            Netlify 静态托管配置
package.json            本地预览脚本
```

## 本地预览

在项目目录运行：

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

然后打开：

```text
http://127.0.0.1:4173
```

注意：PWA 的离线缓存和安装能力需要通过 `http://localhost` 或 HTTPS 访问，直接用 `file://` 打开时不会注册 Service Worker。

## Vercel 发布

1. 把当前目录上传到 GitHub 仓库。
2. 打开 Vercel，选择 `Add New Project`。
3. 导入这个仓库。
4. Framework Preset 选择 `Other`。
5. Build Command 留空。
6. Output Directory 填 `.`。
7. 点击 Deploy。

部署完成后，Vercel 会给你一个 HTTPS 测试链接，可以直接发给用户。

## Netlify 发布

1. 登录 Netlify。
2. 选择 `Add new site`。
3. 可以选择从 GitHub 导入，也可以直接拖拽整个项目文件夹。
4. Publish directory 选择当前目录 `.`。
5. Build command 留空。
6. 发布后复制 Netlify 的 HTTPS 链接给用户测试。

## GitHub Pages 发布

1. 把当前目录提交到 GitHub 仓库。
2. 进入仓库 `Settings`。
3. 打开 `Pages`。
4. Source 选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/root`。
6. 保存后等待 GitHub 生成访问地址。

如果使用 GitHub Pages 子路径，例如 `https://username.github.io/repo-name/`，当前相对路径配置可以正常工作。

## 当前测试版限制

- 登录注册、账单、社区和财务数据都保存在浏览器 `localStorage`。
- 不同设备、不同浏览器之间不会同步。
- 刷新不会丢数据，但用户清除浏览器数据会删除数据。
- 正式上线需要接入后端数据库、真实认证、数据备份、内容审核和 AI 代理接口。

## 正式上线建议

测试期可以先用静态 Web App。准备正式上线时建议升级为：

- 前端：当前页面继续保留，逐步迁移到 Vite/React 或 Next.js。
- 后端：提供用户、账单、社区、AI 消费建议接口。
- 数据库：PostgreSQL 或 MySQL。
- 文件导入：后端解析支付宝/微信账单文件，给用户导入预览。
- AI：后端保存 OpenAI Key，通过 `/api/decision` 代理调用 AI。
