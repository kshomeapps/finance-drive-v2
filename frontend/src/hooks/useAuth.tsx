// Re-export from AuthContext — the app uses httpOnly cookie-based auth
export { useAuth } from "@/context/AuthContext";
export default function useAuth() {
  // Deprecated: use useAuth from @/context/AuthContext directly
  return null;
}
