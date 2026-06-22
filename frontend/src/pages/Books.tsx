import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Book } from "@/types";
import { Trash2, BookOpen } from "lucide-react";

const EMOJI_OPTIONS = ["📁", "🏠", "🚗", "🍔", "💊", "🎮", "✈️", "💼", "🎓", "💰", "🛒", "⚡"];

export default function Books() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📁");

  const { data: books, isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: () => bookApi.list(),
  });

  const create = useMutation({
    mutationFn: (body: { name: string; emoji: string }) => bookApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setName("");
      setEmoji("📁");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => bookApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate({ name: name.trim(), emoji });
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BookOpen className="h-6 w-6" />
        帳本管理
      </h1>

      {/* Create Form */}
      <div className="border rounded-xl p-4 bg-card space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">新增帳本</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">選擇圖示</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`h-9 w-9 rounded-lg text-lg flex items-center justify-center border-2 transition-colors ${
                    emoji === e ? "border-primary bg-primary/10" : "border-transparent hover:border-muted-foreground/30"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="帳本名稱"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "新增中..." : "新增"}
            </Button>
          </div>
        </form>
      </div>

      {/* Books List */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">載入中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(books ?? []).map((book: Book) => (
            <div
              key={book.id}
              className="border rounded-xl p-4 flex items-center justify-between bg-card hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{book.emoji}</span>
                <div>
                  <div className="font-medium">{book.name}</div>
                  <div className="text-xs text-muted-foreground">
                    建立於 {new Date(book.createdAt).toLocaleDateString("zh-TW")}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-red-600 h-8 w-8 p-0"
                onClick={() => remove.mutate(book.id)}
                disabled={remove.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {(books ?? []).length === 0 && (
            <div className="col-span-2 text-center text-muted-foreground py-10 text-sm">
              尚未建立任何帳本
            </div>
          )}
        </div>
      )}
    </div>
  );
}
