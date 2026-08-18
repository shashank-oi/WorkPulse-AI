import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Loader2, LockKeyhole, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api, { apiError } from "@/lib/api";

export default function SetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setError("");

    if (!token) {
      setError("Invalid invitation link.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/set-password", {
        token,
        password,
      });

      setSuccess(true);

      setTimeout(() => {
        navigate("/auth");
      }, 1500);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md border-2 border-foreground bg-card p-8 text-center shadow-brutal-lg">
          <div className="mx-auto flex size-14 items-center justify-center border-2 border-foreground bg-primary">
            <CheckCircle2 className="size-7" />
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Account activated!
          </h1>

          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Your password has been created successfully.
            Redirecting you to login...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="border-2 border-foreground bg-card p-8 shadow-brutal-lg">
          <div className="flex size-12 items-center justify-center border-2 border-foreground bg-primary shadow-brutal-sm">
            <LockKeyhole className="size-6" />
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-widest text-muted-foreground">
            WorkPulse AI
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight">
            Set your password
          </h1>

          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Create a password to activate your employee account.
          </p>

          {!token ? (
            <div className="mt-6 border-2 border-destructive bg-destructive/10 p-4 text-sm font-bold text-destructive">
              Invalid invitation link. Please use the invitation email sent
              by your company admin.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="password"
                  className="text-xs font-black uppercase tracking-widest"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  disabled={loading}
                  className="mt-2 h-12 w-full border-2 border-foreground bg-background px-3 text-sm font-medium outline-none focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="text-xs font-black uppercase tracking-widest"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Confirm your password"
                  disabled={loading}
                  className="mt-2 h-12 w-full border-2 border-foreground bg-background px-3 text-sm font-medium outline-none focus:border-primary"
                />
              </div>

              {error ? (
                <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm font-bold text-destructive">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full text-sm font-black"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Activating account...
                  </>
                ) : (
                  "Set Password"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}