FROM node:22-alpine

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

EXPOSE 80

ENV NODE_ENV=production
ENV PORT=80

CMD ["sh", "start.sh"]
