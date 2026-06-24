FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# 複製工作區配置和依賴
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# 安裝所有依賴
RUN pnpm install --frozen-lockfile

# 複製所有原始碼
COPY . .

# 編譯前端與後端
RUN pnpm --filter frontend build
RUN pnpm --filter backend build

# 最終運行環境
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV NODE_ENV=production

# 只複製必要的運行文件
COPY --from=base /app/package.json /app/pnpm-lock.yaml ./
COPY --from=base /app/backend/package.json ./backend/
COPY --from=base /app/backend/dist ./backend/dist
COPY --from=base /app/frontend/dist ./frontend/dist

# 安裝生產環境依賴
RUN pnpm install --frozen-lockfile --prod --filter backend

EXPOSE 10000
CMD ["pnpm", "--filter", "backend", "start:prod"]
