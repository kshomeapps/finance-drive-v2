import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { summaryApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const CATEGORY_COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#a855f7",
  "#ef4444", "#06b6d4", "#f97316", "#84cc16",
  "#ec4899", "#14b8a6",
];

export default function Statistics() {
  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  const { data: summary, isLoading: sLoading } = useQuery({
    queryKey: ["summary", selectedMonth],
    queryFn: () => summaryApi.get({ month: selectedMonth }),
  });

  const { data: categories, isLoading: cLoading } = useQuery({
    queryKey: ["categories", selectedMonth],
    queryFn: () => summaryApi.categories({ month: selectedMonth }),
  });

  const { data: monthly, isLoading: mLoading } = useQuery({
    queryKey: ["monthly-summary"],
    queryFn: () => summaryApi.monthly(),
  });

  const expenseCategories = (categories ?? []).filter((c) => c.type === "expense");
  const totalExpense = expenseCategories.reduce((s, c) => s + c.total, 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🏠 KSHome · 統計分析</h1>
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
      {sLoading ? (
        <div className="text-muted-foreground text-sm">載入中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">收入</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                £{(summary?.totalIncome ?? 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">支出</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                £{(summary?.totalExpense ?? 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">結餘</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(summary?.balance ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                £{(summary?.balance ?? 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">支出類別分佈</CardTitle>
        </CardHeader>
        <CardContent>
          {cLoading ? (
            <div className="text-muted-foreground text-sm">載入中...</div>
          ) : expenseCategories.length === 0 ? (
            <div className="text-center text-muted-foreground py-6 text-sm">本月暫無支出記錄</div>
          ) : (
            <div className="space-y-3">
              {expenseCategories.map((cat, i) => {
                const pct = totalExpense > 0 ? (cat.total / totalExpense) * 100 : 0;
                const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                return (
                  <div key={`${cat.category}-${cat.type}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-medium">{cat.category}</span>
                        <span className="text-muted-foreground text-xs">（{cat.count}筆）</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                        <span className="font-semibold text-red-600">£{cat.total.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">月度收支明細</CardTitle>
        </CardHeader>
        <CardContent>
          {mLoading ? (
            <div className="text-muted-foreground text-sm">載入中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">月份</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">收入</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">支出</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">結餘</th>
                  </tr>
                </thead>
                <tbody>
                  {(monthly ?? []).slice().reverse().map((row) => {
                    const [, month] = row.month.split("-");
                    const label = `${month}月`;
                    return (
                      <tr key={row.month} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2.5">{label}</td>
                        <td className="py-2.5 text-right text-green-600">£{row.totalIncome.toFixed(2)}</td>
                        <td className="py-2.5 text-right text-red-600">£{row.totalExpense.toFixed(2)}</td>
                        <td className={`py-2.5 text-right font-medium ${row.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                          £{row.balance.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
