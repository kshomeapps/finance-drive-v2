import { useQuery } from "@tanstack/react-query";
import { summaryApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { MonthlySummary } from "@/types";

export default function Dashboard() {
  const { data: summary, isLoading: sLoading } = useQuery({
    queryKey: ["summary"],
    queryFn: () => summaryApi.get(),
  });

  const { data: monthly, isLoading: mLoading } = useQuery({
    queryKey: ["monthly-summary"],
    queryFn: () => summaryApi.monthly(),
  });

  if (sLoading || mLoading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading dashboard...</div>;
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-green-600">${summary.totalIncome.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Expense</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-red-600">${summary.totalExpense.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">${summary.balance.toFixed(2)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Monthly Trend</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Bar dataKey="totalIncome" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalExpense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
