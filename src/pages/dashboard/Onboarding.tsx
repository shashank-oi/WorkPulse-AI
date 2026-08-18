import {
  ArrowRight,
  Building2,
  KeyRound,
  Loader2,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import api, { apiError } from "@/lib/api";

type Mode = "create" | "join";

export function Onboarding() {
  const { user, refresh, signOut } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("create");
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/companies", { name: createName });
      await refresh();
      toast.success("Company created — you're now the admin");
    } catch (err) {
      setError(apiError(err));
      setBusy(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/companies/join", { code: joinCode });
      await refresh();
      toast.success("Welcome aboard — you joined the company");
    } catch (err) {
      setError(apiError(err));
      setBusy(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  const isCreate = mode === "create";

  return (
    <div className="min-h-screen bg-dots bg-background bg-[length:22px_22px]">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between">
          <Logo />
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>

        <div className="mx-auto mt-14 max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-widest text-primary">
            Welcome to WorkPulse AI
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">
            {isCreate ? "Create your company." : "Join your company."}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base font-medium text-muted-foreground">
            {isCreate
              ? "Name your company and you'll be its admin right away — ready to manage attendance and leave."
              : "Enter the code your admin shared and you'll be added to the workspace as an employee."}
          </p>
        </div>

        {error ? (
          <p className="mx-auto mt-6 max-w-md border-2 border-foreground bg-destructive px-3 py-2 text-center text-sm font-bold text-destructive-foreground">
            {error}
          </p>
        ) : null}

        <div className="mx-auto mt-10 max-w-lg">
          {isCreate ? (
            <form
              onSubmit={handleCreate}
              className="border-2 border-foreground bg-card p-6 shadow-brutal-lg sm:p-8"
            >
              <div className="mb-4 flex size-12 items-center justify-center border-2 border-foreground bg-primary text-primary-foreground shadow-brutal-sm">
                <Building2 className="size-6" strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black tracking-tight">
                Start your workspace
              </h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                You'll become the admin of this company and get a private join
                code to share with your team.
              </p>
              <div className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="company-name"
                    className="text-xs font-black uppercase tracking-widest"
                  >
                    Company name
                  </Label>
                  <Input
                    id="company-name"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Nova Labs"
                    required
                    minLength={2}
                    maxLength={60}
                    disabled={busy}
                  />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Signed in as <span className="font-black">{user?.email}</span>
                </p>
              </div>
              <Button
                type="submit"
                className="mt-6 w-full"
                disabled={busy || createName.trim().length < 2}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    Create company
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={handleJoin}
              className="border-2 border-foreground bg-card p-6 shadow-brutal-lg sm:p-8"
            >
              <div className="mb-4 flex size-12 items-center justify-center border-2 border-foreground bg-accent text-accent-foreground shadow-brutal-sm">
                <KeyRound className="size-6" strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black tracking-tight">
                Join with a code
              </h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Enter the code your admin shared to join their company.
              </p>
              <div className="mt-5 space-y-1.5">
                <Label
                  htmlFor="join-code"
                  className="text-xs font-black uppercase tracking-widest"
                >
                  Company code
                </Label>
                <Input
                  id="join-code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PULSE8"
                  className="font-mono font-bold uppercase tracking-[0.2em]"
                  required
                  minLength={4}
                  maxLength={12}
                  disabled={busy}
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="mt-6 w-full"
                disabled={busy || joinCode.trim().length < 4}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    Join company
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          <button
            type="button"
            onClick={() => {
              setMode(isCreate ? "join" : "create");
              setError(null);
            }}
            className="mx-auto mt-6 flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
          >
            {isCreate ? (
              <>
                Already part of a company?
                <span className="underline">Join with a code</span>
              </>
            ) : (
              <>
                New here?
                <span className="underline">Create your company</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
