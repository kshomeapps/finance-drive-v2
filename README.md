# Finance Drive v2 — 個人收支記錄系統

一個功能完整的個人財務管理應用，支援多帳本、類別統計、月度分析。

## 功能特色

- **收支記錄** — 新增、編輯、刪除收入/支出記錄，支援類別、備註、日期篩選
- **統計分析** — 支出類別分佈圖、月度收支趨勢、月度明細表
- **帳本管理** — 建立多個帳本分類管理記錄
- **安全認證** — JWT + HttpOnly Cookie，支援 Token 自動刷新
- **雙資料庫** — 開發用 SQLite，生產可切換 PostgreSQL

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + TailwindCSS |
| UI 組件 | Radix UI + shadcn/ui |
| 圖表 | Recharts |
| 路由 | Wouter |
| 狀態管理 | TanStack Query v5 |
| 後端 | Express.js + TypeScript |
| ORM | Drizzle ORM |
| 資料庫 | SQLite（開發）/ PostgreSQL（生產） |
| 認證 | JWT + bcrypt + HttpOnly Cookie |

---

## 本地開發

### 前置需求

- Node.js 20+
- pnpm 8+

### 安裝與啟動

```bash
# 1. 複製環境變數
cp .env.example .env
# 編輯 .env，填入 JWT_SECRET 和 JWT_REFRESH_SECRET

# 2. 安裝後端依賴
cd backend && pnpm install --ignore-scripts

# 3. 初始化資料庫
pnpm db:push

# 4. 安裝前端依賴
cd ../frontend && pnpm install --ignore-scripts

# 5. 啟動開發伺服器（根目錄）
cd .. && pnpm dev
```

訪問 http://localhost:3000 即可使用。

---

## 免費部署方案

### 方案一：Render.com（推薦，前後端一體）

**適合：** 個人使用，免費方案有 15 分鐘無流量後休眠。

1. 在 [Render.com](https://render.com) 建立帳號
2. 點擊 **New → Web Service**，連接此 GitHub 倉庫
3. 設定：
   - **Root Directory**: `backend`
   - **Build Command**: `pnpm install --ignore-scripts && pnpm run build`
   - **Start Command**: `node dist/index.js`
4. 在 **Environment Variables** 加入：
   ```
   NODE_ENV=production
   PORT=10000
   FRONTEND_URL=https://your-app.onrender.com
   JWT_SECRET=（生成強隨機字串）
   JWT_REFRESH_SECRET=（生成強隨機字串）
   DATABASE_URL=sqlite:///opt/render/project/src/data/finance.sqlite
   ```
5. 在 **Disks** 加入持久磁碟：
   - **Mount Path**: `/opt/render/project/src/data`
   - **Size**: 1 GB（免費）

> **生成 JWT 密鑰**：`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

### 方案二：前後端分開部署（最穩定）

#### 後端：Render.com（免費）

同方案一，但 `FRONTEND_URL` 設為 Netlify 的網址。

#### 前端：Netlify（免費）

1. 在 [Netlify](https://netlify.com) 建立帳號
2. 點擊 **Add new site → Import an existing project**
3. 連接 GitHub 倉庫，設定：
   - **Base directory**: `frontend`
   - **Build command**: `pnpm install --ignore-scripts && pnpm run build`
   - **Publish directory**: `frontend/dist`
4. 在 **Environment Variables** 加入：
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```

---

### 方案三：Railway（免費 $5/月額度）

1. 在 [Railway](https://railway.app) 建立帳號
2. **New Project → Deploy from GitHub repo**
3. 選擇 `backend` 目錄，Railway 會自動偵測 Node.js
4. 加入環境變數（同 Render.com）
5. 可選：加入 PostgreSQL 服務（免費 1GB）

---

## 資料庫遷移

```bash
# 生成遷移文件
cd backend && pnpm db:generate

# 執行遷移
pnpm db:migrate

# 或直接推送 schema（開發用）
pnpm db:push
```

---

## 環境變數說明

| 變數 | 說明 | 必填 |
|------|------|------|
| `PORT` | 後端監聽端口 | 否（預設 5000）|
| `NODE_ENV` | 環境（development/production）| 否 |
| `FRONTEND_URL` | 前端 URL（CORS 設定）| 是 |
| `JWT_SECRET` | JWT 存取 Token 密鑰 | 是 |
| `JWT_REFRESH_SECRET` | JWT 刷新 Token 密鑰 | 是 |
| `DATABASE_URL` | 資料庫連接字串 | 否（預設 SQLite）|
| `VITE_API_URL` | 前端 API 基礎 URL | 否（同域時不需要）|
