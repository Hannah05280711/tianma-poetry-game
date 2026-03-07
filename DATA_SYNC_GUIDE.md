# V2 数据同步指南

本文档说明如何将新的诗人卡牌和题库数据同步到您的数据库。

## 快速开始

如果您已经在 Vercel 上部署了游戏，并且配置了 `DATABASE_URL` 环境变量，请按照以下步骤同步数据：

### 方法一：通过 Vercel CLI 运行同步脚本（推荐）

1. **安装 Vercel CLI**（如果尚未安装）：
   ```bash
   npm install -g vercel
   ```

2. **在项目目录中运行同步脚本**：
   ```bash
   vercel env pull  # 拉取 Vercel 环境变量
   node scripts/sync-v2-data.mjs
   ```

3. **等待同步完成**，您将看到类似的输出：
   ```
   ✅ Database connection established
   ✅ Poet cards sync complete: 2 new cards added
   ✅ Total cards in database: 26
   ✅ Questions import complete: 1000 inserted, 0 errors
   🎉 V2 Data Sync Complete!
   ```

### 方法二：在本地运行（需要数据库访问）

1. **克隆或进入项目目录**：
   ```bash
   cd /path/to/tianma-poetry-game
   ```

2. **安装依赖**（如果尚未安装）：
   ```bash
   pnpm install
   ```

3. **设置数据库连接**：
   ```bash
   # 创建 .env.local 文件
   echo "DATABASE_URL=mysql://user:password@host:3306/dbname" > .env.local
   ```

4. **运行同步脚本**：
   ```bash
   node scripts/sync-v2-data.mjs
   ```

### 方法三：通过 SSH 在远程服务器上运行

如果您的数据库部署在远程服务器上：

```bash
ssh user@your-server.com
cd /path/to/tianma-poetry-game
DATABASE_URL="mysql://user:password@host:3306/dbname" node scripts/sync-v2-data.mjs
```

## 同步脚本做了什么？

`scripts/sync-v2-data.mjs` 脚本执行以下操作：

1. **连接数据库** - 使用 `DATABASE_URL` 环境变量连接到您的 MySQL 数据库
2. **添加新诗人卡牌** - 导入鱼玄机和薛涛两位诗人的卡牌数据
3. **验证卡牌总数** - 确保卡牌库中有 26 张卡片（24 张原始 + 2 张新增）
4. **导入新题库** - 从 `scripts/v2_new_questions.json` 导入 1000+ 道《唐诗三百首》题目
5. **验证题目总数** - 确保填空题库中有足够的题目

## 数据同步后会发生什么？

同步完成后，您的游戏将获得以下更新：

### 卡牌库更新
- **总卡牌数**：从 24 张增加到 26 张
- **新增卡牌**：
  - 鱼玄机（稀有）- 代表诗句：「易求无价宝，难得有心郎」
  - 薛涛（稀有）- 代表诗句：「花开不同赏，花落不同悲」

### 题库更新
- **新增题目**：1000+ 道来自《唐诗三百首》的填空题
- **题目格式**：上下文填空（例如："绝代有____人，幽居在空谷"）
- **难度分布**：1-5 级难度均有分布
- **题目来源**：标记为 `v2_tang300` 主题标签

### 游戏功能
- "解救樊登"模式将显示新的题目
- 通关后有机会掉落新的诗人卡牌
- 卡牌库页面显示 26 张卡片总数

## 常见问题

### Q1: 我已经部署了游戏，但数据没有更新

**原因**：`DATABASE_URL` 环境变量未正确配置，或数据库连接失败。

**解决方案**：
1. 检查 Vercel 项目设置中是否添加了 `DATABASE_URL`
2. 确保数据库连接字符串格式正确
3. 手动运行 `node scripts/sync-v2-data.mjs` 进行同步

### Q2: 运行脚本时出现 "DATABASE_URL not set" 错误

**原因**：环境变量未设置。

**解决方案**：
```bash
# 方法 1：直接设置环境变量
DATABASE_URL="mysql://..." node scripts/sync-v2-data.mjs

# 方法 2：创建 .env.local 文件
echo "DATABASE_URL=mysql://..." > .env.local
node scripts/sync-v2-data.mjs
```

### Q3: 脚本运行成功，但游戏中仍然没有新题目

**原因**：可能是题目查询逻辑的问题。

**解决方案**：
1. 检查 `v2_new_questions.json` 文件是否存在
2. 在数据库中手动查询：`SELECT COUNT(*) FROM questions WHERE themeTag = 'v2_tang300'`
3. 如果查询结果为 0，重新运行同步脚本

### Q4: 如何验证数据是否同步成功？

在您的数据库客户端中运行以下查询：

```sql
-- 检查卡牌总数（应该是 26）
SELECT COUNT(*) as total_cards FROM poetCards;

-- 检查新卡牌是否存在
SELECT * FROM poetCards WHERE poetName IN ('鱼玄机', '薛涛');

-- 检查新题目是否存在
SELECT COUNT(*) as tang300_questions FROM questions WHERE themeTag = 'v2_tang300';

-- 检查所有填空题
SELECT COUNT(*) as fill_questions FROM questions WHERE questionType = 'fill';
```

## 自动同步

如果您想在每次部署时自动同步数据，可以修改 `start.sh` 脚本：

```bash
#!/bin/sh
set -e

echo "[start.sh] Running database migrations..."
node /app/migrate.mjs || echo "[start.sh] Migration warning, continuing..."

echo "[start.sh] Syncing V2 data..."
node /app/scripts/sync-v2-data.mjs || echo "[start.sh] V2 data sync warning, continuing..."

echo "[start.sh] Starting server..."
exec node dist/index.js
```

## 支持

如有问题，请：
1. 查看脚本输出的错误信息
2. 检查数据库连接配置
3. 参考本指南的常见问题部分
4. 查看 GitHub 仓库的 Issues 页面
