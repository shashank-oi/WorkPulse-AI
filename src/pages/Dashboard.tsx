import {
  Bell,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  FileSpreadsheet,
  Fingerprint,
  History,
  Loader2,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState, type ComponentType } from "react";
import { useNavigate } from "react-router";
import { Logo, LogoMark } from "@/components/Logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { Onboarding } from "./dashboard/Onboarding";
import { AdminAttendance } from "./dashboard/sections/AdminAttendance";
import { AdminLeaves } from "./dashboard/sections/AdminLeaves";
import { AdminTeam } from "./dashboard/sections/AdminTeam";
import { EmployeeAttendance } from "./dashboard/sections/EmployeeAttendance";
import { EmployeeNotifications } from "./dashboard/sections/EmployeeNotifications";
import { EmployeeClock } from "./dashboard/sections/EmployeeClock";
import { AdminNotifications } from "./dashboard/sections/AdminNotifications";
import { EmployeeLeaves } from "./dashboard/sections/EmployeeLeaves";
import { EmployeeWorkSheet } from "./dashboard/sections/EmployeeWorkSheet";
import { EmployeeNotificationPopup } from "./dashboard/sections/EmployeeNotificationPopup";
import { StatusBadge } from "./dashboard/ui";

type SectionId = string;

const EMPLOYEE_NAV = [
  { id: "clock", label: "Clock in / out", icon: Fingerprint },
  { id: "leaves", label: "Leave", icon: CalendarCheck },
  { id: "attendance", label: "My attendance", icon: History },
  { id: "work-sheet", label: "My Work Sheet", icon: FileSpreadsheet },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

const ADMIN_NAV = [
  { id: "leaves", label: "Leave requests", icon: ClipboardCheck },
  { id: "attendance", label: "Attendance", icon: CalendarDays },
  { id: "team", label: "Team", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

const EMPLOYEE_SECTIONS: Record<SectionId, ComponentType> = {
  clock: EmployeeClock,
  leaves: EmployeeLeaves,
  attendance: EmployeeAttendance,
  "work-sheet": EmployeeWorkSheet,
  notifications: EmployeeNotifications,
};

const ADMIN_SECTIONS: Record<SectionId, ComponentType> = {
  leaves: AdminLeaves,
  attendance: AdminAttendance,
  team: AdminTeam,
  notifications: AdminNotifications,
};

export default function Dashboard() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<SectionId>("clock");
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const nav = isAdmin ? ADMIN_NAV : EMPLOYEE_NAV;
  const currentSection = nav.find((s) => s.id === section) ?? nav[0];
  const sectionComponents = isAdmin ? ADMIN_SECTIONS : EMPLOYEE_SECTIONS;
  const ActiveSection = currentSection
    ? sectionComponents[currentSection.id]
    : null;

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Loading workspace…
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (!user.companyId) {
    return <Onboarding />;
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b-2 border-foreground px-5 py-4">
        <Logo />
      </div>

      <div className="border-b-2 border-foreground px-5 py-4">
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Company
        </p>
        <div className="flex items-center justify-between gap-2 border-2 border-foreground bg-card px-3 py-2.5 shadow-brutal-sm">
          <span className="truncate text-sm font-black">
            {user.companyName}
          </span>
          <span className="shrink-0 font-mono text-[10px] font-black tracking-widest text-muted-foreground">
            {user.companyCode}
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {isAdmin ? "Admin panel" : "My workspace"}
        </p>

        {nav.map((item) => {
          const isActive = currentSection.id === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSection(item.id);
                setMobileOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 border-2 border-transparent px-3 py-2.5 text-sm font-bold transition-all",
                isActive
                  ? "border-foreground bg-primary text-primary-foreground shadow-brutal-sm"
                  : "text-foreground hover:border-foreground hover:bg-secondary",
              )}
            >
              <item.icon className="size-4" strokeWidth={2.5} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t-2 border-foreground p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 rounded-none border-2 border-foreground">
            <AvatarFallback className="rounded-none bg-primary text-xs font-black text-primary-foreground">
              {initials(user.name ?? undefined, user.email)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black">
              {user.name || "WorkPulse user"}
            </p>

            <p className="truncate text-xs font-semibold text-muted-foreground">
              {user.email}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b-2 border-foreground bg-background px-4 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="w-[300px] border-r-2 border-foreground p-0 shadow-brutal-lg"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            {sidebar}
          </SheetContent>
        </Sheet>

        <LogoMark className="size-8" />

        <span className="text-sm font-black">Dashboard</span>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r-2 border-foreground bg-card md:block">
        {sidebar}
      </aside>

      {/* Main content */}
      <main className="min-h-screen md:pl-72">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          {/* Company context bar */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-2 border-foreground bg-card px-4 py-3 shadow-brutal-sm">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Working in
              </p>

              <p className="text-lg font-black tracking-tight">
                {user.companyName}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={isAdmin ? "admin" : "employee"} />

              {isAdmin ? (
                <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  Admin
                </span>
              ) : null}
            </div>
          </div>

          {ActiveSection ? (
            <ActiveSection key={`${user.companyId}:${currentSection.id}`} />
          ) : null}
        </div>
      </main>

      {/* Employee notification popup */}
      {!isAdmin ? <EmployeeNotificationPopup /> : null}
    </div>
  );
}
