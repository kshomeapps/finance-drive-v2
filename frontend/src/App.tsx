import { Route, Switch, Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Books from "./pages/Books";

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
    <div className="min-h-screen bg-background">
      <nav className="border-b px-4 py-3 flex items-center justify-between bg-card">
        <div className="font-bold text-lg">Finance Drive</div>
        <div className="flex items-center gap-4 text-sm">
          <a href="/" className="hover:underline font-medium">Dashboard</a>
          <a href="/transactions" className="hover:underline font-medium">Transactions</a>
          <a href="/books" className="hover:underline font-medium">Books</a>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">{user.name}</span>
        </div>
      </nav>
      <main className="p-6 max-w-5xl mx-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/books" component={Books} />
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
