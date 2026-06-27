import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — AI Study Planner" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated.");
      router.navigate({ to: "/dashboard", replace: true });
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-muted/30">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold mb-1">Set a new password</h1>
        <p className="text-sm text-muted-foreground mb-6">Choose a password to finish resetting your account.</p>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pw">New password</Label>
            <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Saving..." : "Update password"}</Button>
        </form>
      </Card>
    </div>
  );
}
