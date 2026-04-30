// Reset password page — opened from the email recovery link.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { CheckCircle2, KeyRound, Loader2, Mail, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const passwordSchema = z
  .string()
  .min(8, { message: "At least 8 characters" })
  .regex(/[A-Z]/, { message: "Add at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Add at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Add at least one number" })
  .max(72, { message: "Max 72 characters" });

type ResetState = "verifying" | "ready" | "invalid" | "success";

const getParamFromUrl = (key: string) => {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return search.get(key) || hash.get(key);
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<ResetState>("verifying");
  const [message, setMessage] = useState("Verifying your recovery link…");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    let mounted = true;
    const markReady = () => {
      if (!mounted) return;
      setState("ready");
      setMessage("Choose a strong new password for your account.");
    };
    const markInvalid = (text = "This reset link is invalid, expired, or already used.") => {
      if (!mounted) return;
      setState("invalid");
      setMessage(text);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") markReady();
    });

    const verifyLink = async () => {
      const code = getParamFromUrl("code");
      const recoveryToken = getParamFromUrl("token") || getParamFromUrl("token_hash");
      const accessToken = getParamFromUrl("access_token");
      const refreshToken = getParamFromUrl("refresh_token");
      const type = getParamFromUrl("type");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) return markInvalid(error.message);
        window.history.replaceState({}, document.title, "/reset-password");
        return markReady();
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) return markInvalid(error.message);
        window.history.replaceState({}, document.title, "/reset-password");
        return markReady();
      }

      if (recoveryToken) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: recoveryToken, type: "recovery" });
        if (error) return markInvalid(error.message);
        window.history.replaceState({}, document.title, "/reset-password");
        return markReady();
      }

      const { data } = await supabase.auth.getSession();
      if (data.session && type === "recovery") return markReady();
      markInvalid("Open the latest password reset link from your email to continue.");
    };

    verifyLink();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pv = passwordSchema.safeParse(password);
    if (!pv.success) return toast.error(pv.error.issues[0].message);
    if (password !== confirm) return toast.error("Passwords don't match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pv.data });
    setBusy(false);
    if (error) return toast.error(error.message);
    setState("success");
    setMessage("Password updated successfully. You can now sign in with your new password.");
    toast.success("Password updated successfully");
    setTimeout(() => navigate("/auth", { replace: true }), 1800);
  };

  const requestNewLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailCheck = z.string().email().safeParse(resendEmail.trim());
    if (!emailCheck.success) return toast.error("Enter a valid email address");
    setResending(true);
    const redirectTo = `${import.meta.env.VITE_APP_URL || window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(emailCheck.data, { redirectTo });
    setResending(false);
    if (error) return toast.error(error.message);
    setResent(true);
    toast.success("New reset link sent. Check your inbox.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md p-6 shadow-soft border-border/50">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-glow">
            <KeyRound className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        {state === "ready" ? (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label htmlFor="np">New password</Label>
              <Input
                id="np"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">Min 8 characters with uppercase, lowercase, and a number</p>
            </div>
            <div>
              <Label htmlFor="cp">Confirm password</Label>
              <Input
                id="cp"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full gradient-primary" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </Button>
          </form>
        ) : state === "success" ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/40 p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <p className="text-sm font-medium">Redirecting to sign in…</p>
          </div>
        ) : state === "invalid" ? (
          <div className="space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-5">
            <div className="flex flex-col items-center text-center">
              <ShieldAlert className="h-9 w-9 text-destructive" aria-hidden="true" />
              <h2 className="mt-2 text-base font-semibold">Reset link expired or already used</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                For your security, password reset links can only be used once and expire after a short time. Request a new link below.
              </p>
            </div>

            {resent ? (
              <div className="flex items-start gap-3 rounded-md border border-border bg-background/60 p-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" aria-hidden="true" />
                <div>
                  <p className="font-medium">Check your inbox</p>
                  <p className="text-muted-foreground">
                    If an account exists for <span className="font-medium">{resendEmail}</span>, a new reset link is on its way. The link is valid for a limited time.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={requestNewLink} className="space-y-3">
                <div>
                  <Label htmlFor="resend-email">Email address</Label>
                  <Input
                    id="resend-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary" disabled={resending}>
                  {resending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                      Send a new reset link
                    </>
                  )}
                </Button>
              </form>
            )}

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/auth", { replace: true })}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Checking reset token…</span>
          </div>
        )}
      </Card>
    </div>
  );
}
