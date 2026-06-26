FROM node:20 AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# 複製依賴配置文件
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# 安裝所有依賴（包含編譯工具）
RUN pnpm install --frozen-lockfile

# 複製所有原始碼
COPY . .

# 編譯前端
RUN pnpm --filter frontend build

# 編譯後端
RUN pnpm --filter backend build

# 運行環境
FROM node:20-slim AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV NODE_ENV=production

# 複製必要文件
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist

# 安裝生產環境依賴
RUN pnpm install --frozen-lockfile --prod --filter backend

EXPOSE 10000
# 使用絕對路徑啟動後端
CMD ["node", "backend/dist/index.js"]
