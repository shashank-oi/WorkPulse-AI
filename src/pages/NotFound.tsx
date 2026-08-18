import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dots bg-background bg-[length:22px_22px] px-4">
      <LogoMark className="size-14 shadow-brutal" />
      <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-primary">
        Error 404
      </p>
      <h1 className="mt-2 text-6xl font-black tracking-tight sm:text-7xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-center text-base font-medium text-muted-foreground">
        This page clocked out and never clocked back in. Let's get you back to
        work.
      </p>
      <Button size="lg" asChild className="mt-8">
        <Link to="/">
          <ArrowLeft className="size-5" />
          Back to home
        </Link>
      </Button>
    </div>
  );
}
