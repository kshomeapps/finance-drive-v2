export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Book {
  id: string;
  userId: number;
  name: string;
  emoji: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: number;
  bookId: string | null;
  date: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface Summary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface CategorySummary {
  category: string;
  type: string;
  total: number;
  count: number;
}
