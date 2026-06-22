import dotenv from "dotenv";
dotenv.config();

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
}

export const config = {
  port: parseInt(getEnv("PORT", "5000")),
  nodeEnv: getEnv("NODE_ENV", "development"),
  frontendUrl: getEnv("FRONTEND_URL", "http://localhost:3000"),
  jwtSecret: getEnv("JWT_SECRET"),
  jwtRefreshSecret: getEnv("JWT_REFRESH_SECRET"),
  databaseUrl: getEnv("DATABASE_URL", "sqlite://./data.sqlite"),
  isProduction: getEnv("NODE_ENV", "development") === "production",
  isPostgres: (getEnv("DATABASE_URL", "") as string).startsWith("postgresql") || (getEnv("DATABASE_URL", "") as string).startsWith("postgres"),
} as const;
