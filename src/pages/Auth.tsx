import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/hooks/use-auth";
import { LogoMark } from "@/components/Logo";
import { apiError, API_URL } from "@/lib/api";
import { ArrowRight, Loader2, Lock, Mail, UserRound } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

type Mode = "login" | "signup";

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, login, register } =
    useAuth();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );

  // An invite email links here with ?invite=<email> so the sign-up form is
  // pre-filled and the invited employee joins their company automatically.
  const inviteEmail = searchParams.get("invite");

  const [mode, setMode] = useState<Mode>(
    inviteEmail ? "signup" : "login",
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState(inviteEmail ?? "");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLocalDemo = API_URL.includes("localhost");

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        await login(email, password);
        navigate(redirect);
      } else {
        await register(name, email, password);
        navigate(redirect);
      }
    } catch (err) {
      const message = apiError(err);

      setError(message);

      // An invited email tells the person to create an account: jump there.
      if (mode === "login" && message.includes("invited")) {
        setMode("signup");
      }

      setIsLoading(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <div className="min-h-screen flex flex-col bg-dots bg-background bg-[length:22px_22px] opacity-100">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="flex h-full flex-col items-center justify-center">
          <Card className="w-full min-w-0 max-w-[400px] pb-0 shadow-brutal-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="cursor-pointer transition-transform hover:-translate-y-0.5"
                  aria-label="Back to home"
                >
                  <LogoMark className="size-14 shadow-brutal" />
                </button>
              </div>

              <CardTitle className="text-2xl font-black tracking-tight">
                {isSignup ? "Create your account" : "Welcome back"}
              </CardTitle>

              <CardDescription className="font-medium">
                {isSignup
                  ? "Sign up and you'll be ready to join or create a company."
                  : "Log in to your WorkPulse AI workspace."}
              </CardDescription>
            </CardHeader>

            {inviteEmail ? (
              <p className="mx-6 mb-5 border-2 border-foreground bg-primary px-3 py-2 text-sm font-black text-primary-foreground shadow-brutal-sm">
                You were invited to join a company — create your account
                below and you'll be added automatically.
              </p>
            ) : null}

            {/* Mode switch */}
            <div className="mx-6 mb-5 grid grid-cols-2 border-2 border-foreground bg-secondary p-1">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`cursor-pointer border-2 border-transparent px-3 py-1.5 text-sm font-black uppercase tracking-widest transition-all ${
                    mode === m
                      ? "border-foreground bg-primary text-primary-foreground shadow-brutal-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {isSignup ? (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="name"
                      className="text-xs font-black uppercase tracking-widest"
                    >
                      Name
                    </Label>

                    <div className="relative">
                      <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        className="h-11 pl-9"
                        maxLength={60}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                ) : null}

                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-black uppercase tracking-widest"
                  >
                    Email
                  </Label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="h-11 pl-9"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-xs font-black uppercase tracking-widest"
                  >
                    Password
                  </Label>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        isSignup
                          ? "At least 6 characters"
                          : "Your password"
                      }
                      className="h-11 pl-9"
                      minLength={6}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="border-2 border-foreground bg-destructive px-2 py-1 text-sm font-semibold text-destructive-foreground">
                    {error}
                  </p>
                )}

                {isLocalDemo ? (
                  <p className="border-2 border-dashed border-foreground/30 bg-secondary/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                    Local demo — admin: demo@workpulse.ai / password123 ·
                    employee: demo2@workpulse.ai / password123
                  </p>
                ) : null}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={
                    isLoading ||
                    !email.trim() ||
                    password.length < 6
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {isSignup
                        ? "Creating account..."
                        : "Logging in..."}
                    </>
                  ) : (
                    <>
                      {isSignup ? "Create account" : "Log in"}
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </CardContent>

              <CardFooter className="flex-col pb-6">
                <p className="text-sm font-medium text-muted-foreground">
                  {isSignup
                    ? "Already have an account?"
                    : "New to WorkPulse AI?"}{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0 font-bold"
                    onClick={() => {
                      setMode(isSignup ? "login" : "signup");
                      setError(null);
                    }}
                  >
                    {isSignup ? "Log in" : "Sign up"}
                  </Button>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}