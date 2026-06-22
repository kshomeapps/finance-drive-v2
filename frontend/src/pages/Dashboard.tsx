import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { summaryApi, transactionApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

import { TrendingUp, TrendingDown, Wallet, ArrowLeftRight } from "lucide-react";

function getMonthOptions() {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, "0")}月`;
    opts.push({ value: val, label });
  }
  return opts;
}

export default function Dashboard() {
  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  const { data: summary, isLoading: sLoading } = useQuery({
    queryKey: ["summary", selectedMonth],
    queryFn: () => summaryApi.get({ month: selectedMonth }),
  });

  const { data: monthly, isLoading: mLoading } = useQuery({
    queryKey: ["monthly-summary"],
    queryFn: () => summaryApi.monthly(),
  });

  const { data: recentData } = useQuery({
    queryKey: ["transactions-recent", selectedMonth],
    queryFn: () => transactionApi.list({ month: selectedMonth, limit: 5, page: 1 }),
  });

  if (sLoading || mLoading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">載入中...</div>;
  }

  const recentTx = recentData?.data ?? [];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🏠 KSHome · 總覽</h1>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">收入</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              £{(summary?.totalIncome ?? 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">支出</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              £{(summary?.totalExpense ?? 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">結餘</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.balance ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              £{(summary?.balance ?? 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">月度收支趨勢（近6個月）</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `£${v}`} />
              <Tooltip formatter={(value: number) => `£${value.toFixed(2)}`} />
              <Bar dataKey="totalIncome" fill="#22c55e" name="收入" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalExpense" fill="#ef4444" name="支出" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            最近交易
          </CardTitle>
          <a href="/transactions" className="text-sm text-primary hover:underline">查看全部</a>
        </CardHeader>
        <CardContent>
          {recentTx.length === 0 ? (
            <div className="text-center text-muted-foreground py-6 text-sm">本月暫無記錄</div>
          ) : (
            <div className="space-y-2">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="text-sm font-medium">{tx.category}</div>
                    <div className="text-xs text-muted-foreground">{tx.date} {tx.description && `· ${tx.description}`}</div>
                  </div>
                  <div className={`text-sm font-bold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {tx.type === "income" ? "+" : "-"}£{tx.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
