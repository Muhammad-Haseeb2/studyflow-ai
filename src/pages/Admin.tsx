// Admin panel: overview metrics, user management, and activity browser across all tables.
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Users,
  Brain,
  NotebookPen,
  Layers,
  Calendar,
  Timer,
  Sparkles,
  Shield,
  ShieldOff,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type AdminUser = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
};

const TABLES = [
  { key: "study_sessions", label: "Study sessions", icon: Timer, fields: ["label", "mode", "duration_sec", "started_at"] },
  { key: "notes", label: "Notes", icon: NotebookPen, fields: ["title", "updated_at"] },
  { key: "quiz_results", label: "Quiz results", icon: Brain, fields: ["topic", "score", "total", "correct"] },
  { key: "flashcards", label: "Flashcards", icon: Layers, fields: ["deck_title", "question"] },
  { key: "calendar_events", label: "Calendar", icon: Calendar, fields: ["title", "category", "starts_at"] },
  { key: "ai_interactions", label: "AI interactions", icon: Sparkles, fields: ["feature_type", "input_text"] },
] as const;

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-16" />
          ) : (
            <div className="text-2xl font-bold">{value}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw error;
      return (data ?? []) as AdminUser[];
    },
  });

  const counts = useQuery({
    queryKey: ["admin", "counts"],
    queryFn: async () => {
      const tables = ["study_sessions", "notes", "quiz_results", "flashcards", "calendar_events", "ai_interactions"] as const;
      const results = await Promise.all(
        tables.map((t) =>
          supabase
            .from(t)
            .select("*", { count: "exact", head: true })
            .then((r) => [t, r.count ?? 0] as const),
        ),
      );
      return Object.fromEntries(results) as Record<(typeof tables)[number], number>;
    },
  });

  const grantAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Admin granted");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Admin revoked");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return usersQuery.data ?? [];
    return (usersQuery.data ?? []).filter(
      (u) =>
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.display_name ?? "").toLowerCase().includes(q),
    );
  }, [usersQuery.data, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Panel"
        description="Monitor users and inspect activity across the platform."
        icon={Shield}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Users" value={usersQuery.data?.length ?? 0} icon={Users} loading={usersQuery.isLoading} />
        <StatCard label="Study sessions" value={counts.data?.study_sessions ?? 0} icon={Timer} loading={counts.isLoading} />
        <StatCard label="Notes" value={counts.data?.notes ?? 0} icon={NotebookPen} loading={counts.isLoading} />
        <StatCard label="Quiz results" value={counts.data?.quiz_results ?? 0} icon={Brain} loading={counts.isLoading} />
        <StatCard label="Flashcards" value={counts.data?.flashcards ?? 0} icon={Layers} loading={counts.isLoading} />
        <StatCard label="Calendar events" value={counts.data?.calendar_events ?? 0} icon={Calendar} loading={counts.isLoading} />
        <StatCard label="AI interactions" value={counts.data?.ai_interactions ?? 0} icon={Sparkles} loading={counts.isLoading} />
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="users">Users</TabsTrigger>
          {TABLES.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* USERS */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">All users</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search email or name…"
                  className="pl-8"
                />
              </div>
            </CardHeader>
            <CardContent>
              {usersQuery.isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last sign in</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const isAdmin = u.roles?.includes("admin");
                      return (
                        <TableRow key={u.user_id}>
                          <TableCell>
                            <div className="font-medium">{u.display_name || "—"}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {u.roles?.length ? (
                                u.roles.map((r) => (
                                  <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>
                                    {r}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline">user</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {u.last_sign_in_at
                              ? formatDistanceToNow(new Date(u.last_sign_in_at), { addSuffix: true })
                              : "Never"}
                          </TableCell>
                          <TableCell className="text-right">
                            {isAdmin ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => revokeAdmin.mutate(u.user_id)}
                                disabled={revokeAdmin.isPending}
                              >
                                <ShieldOff className="mr-1 h-3.5 w-3.5" /> Revoke admin
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => grantAdmin.mutate(u.user_id)}
                                disabled={grantAdmin.isPending}
                              >
                                <Shield className="mr-1 h-3.5 w-3.5" /> Make admin
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PER-TABLE BROWSERS */}
        {TABLES.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            <TableBrowser tableKey={t.key} label={t.label} fields={t.fields as unknown as string[]} users={usersQuery.data ?? []} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function TableBrowser({
  tableKey,
  label,
  fields,
  users,
}: {
  tableKey: (typeof TABLES)[number]["key"];
  label: string;
  fields: string[];
  users: AdminUser[];
}) {
  const userMap = useMemo(() => {
    const m = new Map<string, AdminUser>();
    users.forEach((u) => m.set(u.user_id, u));
    return m;
  }, [users]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "table", tableKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableKey)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Array<Record<string, unknown>>;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent {label.toLowerCase()}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  {fields.map((f) => (
                    <TableHead key={f}>{f.replace(/_/g, " ")}</TableHead>
                  ))}
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((row) => {
                  const u = userMap.get(row.user_id as string);
                  return (
                    <TableRow key={row.id as string}>
                      <TableCell>
                        <div className="text-sm font-medium">{u?.display_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{u?.email || (row.user_id as string)?.slice(0, 8)}</div>
                      </TableCell>
                      {fields.map((f) => {
                        const v = row[f];
                        const text =
                          v == null
                            ? "—"
                            : typeof v === "string" && /T\d{2}:\d{2}/.test(v)
                              ? new Date(v).toLocaleString()
                              : String(v);
                        return (
                          <TableCell key={f} className="max-w-[260px] truncate text-sm">
                            {text}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-sm text-muted-foreground">
                        {row.created_at
                          ? formatDistanceToNow(new Date(row.created_at as string), { addSuffix: true })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={fields.length + 2} className="py-8 text-center text-sm text-muted-foreground">
                      No records yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
