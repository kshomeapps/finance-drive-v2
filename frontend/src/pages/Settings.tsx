import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameMsg, setNameMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setNameSaving(true);
    setNameMsg("");
    try {
      await api.put("/api/auth/profile", { name: name.trim() });
      setNameMsg("✓ 名稱已更新");
    } catch (err: any) {
      setNameMsg(`✗ ${err.message}`);
    } finally {
      setNameSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMsg("✗ 新密碼與確認密碼不一致");
      return;
    }
    if (newPassword.length < 6) {
      setPwMsg("✗ 新密碼至少需要 6 個字元");
      return;
    }
    setPwSaving(true);
    setPwMsg("");
    try {
      await api.put("/api/auth/password", { currentPassword, newPassword });
      setPwMsg("✓ 密碼已更新");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwMsg(`✗ ${err.message}`);
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">⚙️ 設定</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">個人資料</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-muted-foreground">
            電子郵件：<span className="font-medium text-foreground">{user?.email}</span>
          </div>
          <form onSubmit={handleSaveName} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">顯示名稱</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="您的名稱"
                required
              />
            </div>
            {nameMsg && (
              <p className={`text-sm ${nameMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                {nameMsg}
              </p>
            )}
            <Button type="submit" disabled={nameSaving}>
              {nameSaving ? "儲存中..." : "儲存名稱"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">更改密碼</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">目前密碼</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">新密碼</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="最少 6 個字元"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">確認新密碼</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次輸入新密碼"
                required
              />
            </div>
            {pwMsg && (
              <p className={`text-sm ${pwMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                {pwMsg}
              </p>
            )}
            <Button type="submit" disabled={pwSaving}>
              {pwSaving ? "更新中..." : "更新密碼"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">關於</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>Finance Drive v2 — 個人收支記錄系統</p>
          <p>支援多帳本、類別統計、月度分析</p>
        </CardContent>
      </Card>
    </div>
  );
}
