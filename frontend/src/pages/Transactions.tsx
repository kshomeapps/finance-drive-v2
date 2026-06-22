import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Transaction } from "@/types";

export default function Transactions() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 10;
  const [form, setForm] = useState<{
    date: string;
    type: "income" | "expense";
    amount: string;
    category: string;
    description: string;
    bookId: string;
  }>({
    date: new Date().toISOString().slice(0, 10),
    type: "expense",
    amount: "",
    category: "",
    description: "",
    bookId: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", page],
    queryFn: () => transactionApi.list({ page, limit }),
  });

  const create = useMutation({
    mutationFn: (body: Omit<Transaction, "id" | "userId" | "createdAt">) => transactionApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      setForm({ ...form, amount: "", category: "", description: "" });
    },
  });

  const deleteTx = useMutation({
    mutationFn: (id: string) => transactionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) return;
    create.mutate({
      date: form.date,
      type: form.type,
      amount,
      category: form.category,
      description: form.description,
      bookId: form.bookId || null,
    });
  }

  const transactions = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Transactions</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
        <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        <Select value={form.type} onValueChange={(v: "income" | "expense") => setForm({ ...form, type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Amount" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
        <Input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
        <Input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <Button type="submit" disabled={create.isPending}>Add</Button>
      </form>

      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-2">{tx.date}</td>
                    <td className="px-4 py-2 capitalize">{tx.type}</td>
                    <td className="px-4 py-2 text-right font-medium">${tx.amount.toFixed(2)}</td>
                    <td className="px-4 py-2">{tx.category}</td>
                    <td className="px-4 py-2 text-muted-foreground">{tx.description}</td>
                    <td className="px-4 py-2">
                      <Button variant="destructive" size="sm" onClick={() => deleteTx.mutate(tx.id)} disabled={deleteTx.isPending}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No transactions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
