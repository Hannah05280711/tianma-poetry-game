# Vercel 部署指南

本文档说明如何将"天马诗词游戏"部署到 Vercel 平台。

## 快速开始

### 1. 前置条件
- 已有 GitHub 账户和 Vercel 账户
- 项目已推送到 GitHub：`https://github.com/Hannah05280711/tianma-poetry-game`

### 2. 部署步骤

#### 方法一：通过 Vercel 网站（推荐）

1. 访问 [Vercel 官网](https://vercel.com)
2. 使用 GitHub 账户登录
3. 点击 **"Add New"** → **"Project"**
4. 在 "Import Git Repository" 中搜索并选择 `Hannah05280711/tianma-poetry-game`
5. 点击 **"Import"**
6. 在项目配置页面，确认以下设置：
   - **Project Name**: `tianma-poetry-game`（或自定义）
   - **Framework Preset**: `Other`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`
7. 根据需要添加环境变量（如有）
8. 点击 **"Deploy"** 开始部署

#### 方法二：使用 Vercel CLI

```bash
cd /path/to/tianma-poetry-game
vercel --prod
```

按照提示完成部署配置。

### 3. 环境变量配置

如果项目需要以下环境变量，请在 Vercel 项目设置中添加：

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `DATABASE_URL` | 数据库连接字符串 | `mysql://user:pass@host/db` |
| `OAUTH_SERVER_URL` | OAuth 服务器地址 | `https://oauth.example.com` |
| `AWS_ACCESS_KEY_ID` | AWS 访问密钥 | - |
| `AWS_SECRET_ACCESS_KEY` | AWS 秘密密钥 | - |
| `OPENAI_API_KEY` | OpenAI API 密钥 | - |

### 4. 部署完成

部署成功后，您将获得一个永久链接，格式为：
```
https://tianma-poetry-game-[随机字符].vercel.app
```

每次向 GitHub 仓库的 `main` 分支推送代码时，Vercel 会自动触发重新部署。

### 5. 常见问题

**Q: 部署失败，提示构建错误？**
A: 检查 `pnpm build` 命令是否能在本地成功运行。查看 Vercel 的构建日志获取详细错误信息。

**Q: 数据库连接失败？**
A: 确保 `DATABASE_URL` 环境变量正确配置，且数据库服务器允许 Vercel 的 IP 地址访问。

**Q: 如何自定义域名？**
A: 在 Vercel 项目设置中的 "Domains" 选项卡添加自定义域名。

## 项目架构

- **前端**: React + Vite
- **后端**: Express.js + Node.js
- **数据库**: MySQL
- **构建输出**: `dist` 目录

## 支持

如有问题，请参考 [Vercel 官方文档](https://vercel.com/docs)。
