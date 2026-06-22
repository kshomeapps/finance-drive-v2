import { Route, Switch, Router, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Books from "./pages/Books";
import Statistics from "./pages/Statistics";
import Settings from "./pages/Settings";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart2,
  Settings as SettingsIcon,
  LogOut,
  BookOpen,
  ChevronDown,
  Home,
} from "lucide-react";
import { useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.message?.includes("Session expired")) return false;
        return failureCount < 3;
      },
    },
  },
});

function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [booksOpen, setBooksOpen] = useState(false);

  const navItem = (href: string, icon: React.ReactNode, label: string) => {
    const active = location === href;
    return (
      <Link href={href}>
        <a
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            active
              ? "bg-white/10 text-white"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          {icon}
          {label}
        </a>
      </Link>
    );
  };

  return (
    <aside className="w-52 min-h-screen bg-slate-800 flex flex-col text-white shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2 font-bold text-base">
          <BarChart2 className="h-5 w-5 text-orange-400" />
          個人收支記錄
        </div>
      </div>

      {/* Book selector */}
      <div className="px-3 py-3 border-b border-white/10">
        <button
          onClick={() => setBooksOpen(!booksOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-orange-400" />
            KSHome
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${booksOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1">
        {navItem("/", <LayoutDashboard className="h-4 w-4" />, "總覽")}
        {navItem("/transactions", <ArrowLeftRight className="h-4 w-4" />, "收支記錄")}
        {navItem("/statistics", <BarChart2 className="h-4 w-4" />, "統計分析")}
        {navItem("/books", <BookOpen className="h-4 w-4" />, "帳本管理")}
        {navItem("/settings", <SettingsIcon className="h-4 w-4" />, "設定")}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <div className="h-7 w-7 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="text-sm text-slate-200 truncate">{user?.name}</span>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          登出
        </button>
      </div>
    </aside>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/register" component={Register} />
        <Route path="/:rest*" component={Login} />
      </Switch>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/statistics" component={Statistics} />
          <Route path="/books" component={Books} />
          <Route path="/settings" component={Settings} />
          <Route path="/:rest*">
            <Dashboard />
          </Route>
        </Switch>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
