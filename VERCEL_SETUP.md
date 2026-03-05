# Vercel 部署完整指南

本指南说明如何将"天马诗词游戏"成功部署到 Vercel，并确保所有优化功能（新诗人卡片、题库更新、卡牌掉落）正常运行。

## 前置条件

1. 已有 GitHub 账户和 Vercel 账户
2. 项目已推送到 GitHub：`https://github.com/Hannah05280711/tianma-poetry-game`
3. 已有数据库服务（MySQL 或兼容服务）

## 第一步：在 Vercel 导入项目

1. 访问 [Vercel 官网](https://vercel.com)
2. 使用 GitHub 账户登录
3. 点击 **"Add New"** → **"Project"**
4. 在 "Import Git Repository" 中搜索并选择 `Hannah05280711/tianma-poetry-game`
5. 点击 **"Import"**

## 第二步：配置项目设置

在项目配置页面，确认以下设置：

| 配置项 | 值 |
|-------|-----|
| **Project Name** | `tianma-poetry-game`（或自定义） |
| **Framework Preset** | `vite` |
| **Build Command** | `pnpm build` |
| **Output Directory** | `dist/public` |
| **Install Command** | `pnpm install` |
| **Node.js Version** | `20.x` 或更高 |

## 第三步：添加环境变量

这一步**至关重要**，直接影响游戏功能是否正常运行。

### 3.1 在 Vercel 项目设置中添加环境变量

1. 在 Vercel 项目页面，点击 **"Settings"** → **"Environment Variables"**
2. 添加以下环境变量：

#### 必需环境变量

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `DATABASE_URL` | **必需** - MySQL 数据库连接字符串 | `mysql://user:password@host:3306/dbname` |
| `NODE_ENV` | 运行环境 | `production` |

#### 可选环境变量（如果使用相关功能）

| 环境变量 | 说明 |
|---------|------|
| `OAUTH_SERVER_URL` | OAuth 服务器地址（如有） |
| `JWT_SECRET` | JWT 签名密钥（如有） |
| `AWS_ACCESS_KEY_ID` | AWS 访问密钥（如使用 S3 存储） |
| `AWS_SECRET_ACCESS_KEY` | AWS 秘密密钥（如使用 S3 存储） |

### 3.2 获取数据库连接字符串

根据您使用的数据库服务：

**MySQL 本地或自建服务器：**
```
mysql://username:password@hostname:3306/database_name
```

**云数据库服务（如 PlanetScale、Render、Railway）：**
- 登录您的数据库服务提供商
- 在连接设置中复制 MySQL 连接字符串
- 粘贴到 Vercel 的 `DATABASE_URL` 环境变量中

## 第四步：部署

1. 确认所有环境变量已正确添加
2. 点击 **"Deploy"** 按钮开始部署
3. 等待部署完成（通常需要 2-5 分钟）

## 第五步：验证部署

部署完成后，您将获得一个永久链接，格式为：
```
https://tianma-poetry-game-[随机字符].vercel.app
```

### 验证清单

- [ ] 网站能够正常加载
- [ ] "解救樊登"模式有题目显示
- [ ] 卡牌库中有 26 张卡片（包括新增的鱼玄机和薛涛）
- [ ] 通关后有卡牌掉落动画
- [ ] 题目来源包括《唐诗三百首》的诗人和诗名

## 常见问题

### Q1: 部署失败，提示 "Build failed"

**原因**：通常是构建命令出错或依赖安装失败。

**解决方案**：
1. 查看 Vercel 的构建日志获取详细错误信息
2. 在本地运行 `pnpm build` 确保构建成功
3. 检查 `package.json` 中的依赖是否正确

### Q2: 网站加载成功，但题目不显示或卡牌数量仍是 24 张

**原因**：`DATABASE_URL` 环境变量未正确配置，导致数据库更新脚本无法执行。

**解决方案**：
1. 在 Vercel 项目设置中检查 `DATABASE_URL` 是否已添加
2. 确保数据库连接字符串格式正确
3. 确保数据库服务器允许 Vercel 的 IP 地址访问
4. 点击 **"Redeploy"** 重新部署

### Q3: 数据库连接超时

**原因**：数据库服务器可能不允许 Vercel 的 IP 地址访问。

**解决方案**：
1. 如果使用云数据库服务，检查防火墙/网络设置
2. 允许所有 IP 地址访问（仅用于测试）或将 Vercel 的 IP 加入白名单
3. 确保数据库服务器在线且可访问

### Q4: 如何自定义域名？

1. 在 Vercel 项目页面，点击 **"Settings"** → **"Domains"**
2. 点击 **"Add"** 并输入您的自定义域名
3. 按照 Vercel 的指示更新 DNS 记录

## 自动重新部署

每次向 GitHub 仓库的 `main` 分支推送代码时，Vercel 会自动触发重新部署。这样您可以持续更新游戏内容而无需手动操作。

## 支持

如有问题，请参考：
- [Vercel 官方文档](https://vercel.com/docs)
- [项目 GitHub 仓库](https://github.com/Hannah05280711/tianma-poetry-game)
