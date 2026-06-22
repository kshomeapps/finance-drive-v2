import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Book } from "@/types";

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
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => bookApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Books</h1>
      <form
        onSubmit={(e) => { e.preventDefault(); create.mutate({ name, emoji }); }}
        className="flex gap-3 max-w-md"
      >
        <Input placeholder="Book name" value={name} onChange={e => setName(e.target.value)} required />
        <Input className="w-20 text-center" value={emoji} onChange={e => setEmoji(e.target.value)} />
        <Button type="submit" disabled={create.isPending}>Create</Button>
      </form>

      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {books?.map((book: Book) => (
            <div key={book.id} className="border rounded-lg p-4 flex items-center justify-between bg-card hover:shadow transition-shadow">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{book.emoji}</span>
                <span className="font-medium">{book.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove.mutate(book.id)} disabled={remove.isPending}>
                Delete
              </Button>
            </div>
          ))}
          {books?.length === 0 && (
            <div className="col-span-3 text-center text-muted-foreground py-8">No books yet</div>
          )}
        </div>
      )}
    </div>
  );
}
