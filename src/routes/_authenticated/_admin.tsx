import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_authenticated/_admin")({
  component: AdminGuard,
});

function AdminGuard() {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" />;
  return <Outlet />;
}