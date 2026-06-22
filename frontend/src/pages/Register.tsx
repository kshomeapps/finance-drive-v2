import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart2 } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("密碼至少需要 6 個字元");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "註冊失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-slate-800 mb-4">
            <BarChart2 className="h-6 w-6 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Finance Drive</h1>
          <p className="text-sm text-slate-500 mt-1">個人收支記錄系統</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold">建立帳號</h2>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-100 p-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">顯示名稱</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="您的名稱"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">電子郵件</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">密碼</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="最少 6 個字元"
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "註冊中..." : "建立帳號"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            已有帳號？{" "}
            <a href="/" className="text-primary font-medium hover:underline">
              立即登入
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
