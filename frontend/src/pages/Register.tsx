import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Register() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await register(name, email, password);
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-6 border rounded-lg shadow bg-card">
        <h2 className="text-2xl font-bold text-center">Register</h2>
        {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" />
        </div>
        <Button type="submit" className="w-full">Register</Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <a href="/" className="underline text-primary">Login</a>
        </p>
      </form>
    </div>
  );
}
