FROM node:22-alpine AS builder

WORKDIR /app

# 安装指定版本的 pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装全部依赖（含 devDependencies，构建需要）
RUN pnpm install --no-frozen-lockfile

# 复制源码
COPY . .

# 构建前端和后端（输出到 dist/ 目录）
RUN pnpm build

# 生产镜像
FROM node:22-alpine AS runner

WORKDIR /app

# 安装指定版本的 pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# 只安装生产依赖
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile --prod

# 复制构建产物（后端 dist/index.js + 前端 dist/public/）
COPY --from=builder /app/dist ./dist

# 复制 drizzle 迁移文件
COPY --from=builder /app/drizzle ./drizzle

# 复制迁移脚本和启动脚本
COPY --from=builder /app/migrate.mjs ./migrate.mjs
COPY --from=builder /app/start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 80

ENV NODE_ENV=production
ENV PORT=80

CMD ["sh", "start.sh"]
