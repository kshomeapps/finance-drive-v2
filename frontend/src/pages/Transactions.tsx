import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionApi, bookApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Transaction, Book } from "@/types";
import { Trash2, Pencil, X, Check } from "lucide-react";

function getMonthOptions() {
  const opts: { value: string; label: string }[] = [{ value: "", label: "全部月份" }];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, "0")}月`;
    opts.push({ value: val, label });
  }
  return opts;
}

const PRESET_CATEGORIES = {
  expense: ["住房", "餐飲", "Grocery", "Fuel", "交通", "娛樂", "醫療", "其他支出"],
  income: ["薪資", "獎金", "投資", "其他收入"],
};

type EditState = {
  id: string;
  date: string;
  type: "income" | "expense";
  amount: string;
  category: string;
  description: string;
  bookId: string | null;
};

export default function Transactions() {
  const queryClient = useQueryClient();
  const monthOptions = getMonthOptions();
  const today = new Date().toISOString().slice(0, 10);

  const [page, setPage] = useState(1);
  const limit = 20;
  const [filterMonth, setFilterMonth] = useState(monthOptions[1]?.value ?? "");
  const [filterType, setFilterType] = useState("");
  const [editState, setEditState] = useState<EditState | null>(null);

  const [form, setForm] = useState({
    date: today,
    type: "expense" as "income" | "expense",
    amount: "",
    category: "",
    description: "",
    bookId: "",
  });

  const { data: booksData } = useQuery({
    queryKey: ["books"],
    queryFn: () => bookApi.list(),
  });
  const books: Book[] = booksData ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", page, filterMonth, filterType],
    queryFn: () =>
      transactionApi.list({
        page,
        limit,
        month: filterMonth || undefined,
        type: filterType || undefined,
      }),
  });

  const create = useMutation({
    mutationFn: (body: Omit<Transaction, "id" | "userId" | "createdAt">) =>
      transactionApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setForm({ ...form, amount: "", category: "", description: "" });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Omit<Transaction, "id" | "userId" | "createdAt">> }) =>
      transactionApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditState(null);
    },
  });

  const deleteTx = useMutation({
    mutationFn: (id: string) => transactionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
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
      category: form.category || (form.type === "expense" ? "其他支出" : "其他收入"),
      description: form.description,
      bookId: form.bookId || null,
    });
  }

  function startEdit(tx: Transaction) {
    setEditState({
      id: tx.id,
      date: tx.date,
      type: tx.type,
      amount: String(tx.amount),
      category: tx.category,
      description: tx.description,
      bookId: tx.bookId,
    });
  }

  function saveEdit() {
    if (!editState) return;
    const amount = parseFloat(editState.amount);
    if (isNaN(amount) || amount <= 0) return;
    update.mutate({
      id: editState.id,
      body: {
        date: editState.date,
        type: editState.type,
        amount,
        category: editState.category,
        description: editState.description,
        bookId: editState.bookId,
      },
    });
  }

  const transactions = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">📋 收支記錄</h1>

      {/* Add Form */}
      <div className="border rounded-xl p-4 bg-card space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">新增記錄</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-7 gap-2 items-end">
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="col-span-1"
          />
          <Select value={form.type} onValueChange={(v: "income" | "expense") => setForm({ ...form, type: v, category: "" })}>
            <SelectTrigger><SelectValue placeholder="類型" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">收入</SelectItem>
              <SelectItem value="expense">支出</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="金額"
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue placeholder="類別" /></SelectTrigger>
            <SelectContent>
              {PRESET_CATEGORIES[form.type].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="備註"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {books.length > 0 && (
            <Select value={form.bookId} onValueChange={(v) => setForm({ ...form, bookId: v })}>
              <SelectTrigger><SelectValue placeholder="帳本" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">無帳本</SelectItem>
                {books.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.emoji} {b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "新增中..." : "新增"}
          </Button>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filterMonth}
          onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">全部類型</option>
          <option value="income">收入</option>
          <option value="expense">支出</option>
        </select>
        {(filterMonth || filterType) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterMonth(""); setFilterType(""); setPage(1); }}>
            清除篩選
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">
          共 {pagination?.total ?? 0} 筆
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">載入中...</div>
      ) : (
        <>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">日期</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">類型</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">金額</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">類別</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">備註</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) =>
                  editState?.id === tx.id ? (
                    <tr key={tx.id} className="border-t bg-accent/20">
                      <td className="px-2 py-1.5">
                        <Input
                          type="date"
                          value={editState.date}
                          onChange={(e) => setEditState({ ...editState, date: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Select value={editState.type} onValueChange={(v: "income" | "expense") => setEditState({ ...editState, type: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">收入</SelectItem>
                            <SelectItem value="expense">支出</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          step="0.01"
                          value={editState.amount}
                          onChange={(e) => setEditState({ ...editState, amount: e.target.value })}
                          className="h-8 text-xs text-right"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          value={editState.category}
                          onChange={(e) => setEditState({ ...editState, category: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          value={editState.description}
                          onChange={(e) => setEditState({ ...editState, description: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex gap-1">
                          <Button size="sm" className="h-7 w-7 p-0" onClick={saveEdit} disabled={update.isPending}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditState(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={tx.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 text-muted-foreground">{tx.date}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          tx.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {tx.type === "income" ? "收入" : "支出"}
                        </span>
                      </td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {tx.type === "income" ? "+" : "-"}£{tx.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5">{tx.category}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{tx.description}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => startEdit(tx)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                            onClick={() => deleteTx.mutate(tx.id)}
                            disabled={deleteTx.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">
                      暫無記錄
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                上一頁
              </Button>
              <span className="text-sm text-muted-foreground">
                第 {pagination.page} / {pagination.totalPages} 頁（共 {pagination.total} 筆）
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
              >
                下一頁
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
