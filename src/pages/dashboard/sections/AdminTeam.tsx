import {
  CalendarCheck2,
  Check,
  Clock4,
  Copy,
  Eye,
  KeyRound,
  Loader2,
  Mail,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDate,
  formatDay,
  formatHours,
  formatMonth,
  formatTime,
  hoursBetween,
  initials,
  todayLocal,
} from "@/lib/format";
import api, {
  apiError,
  type AttendanceRecord,
  type Company,
  type LeaveRequest,
  type Member,
} from "@/lib/api";
import { EmptyState, SectionHeading, StatCard, StatusBadge } from "../ui";

const TYPE_LABELS: Record<string, string> = {
  annual: "Annual",
  sick: "Sick",
  personal: "Personal",
  unpaid: "Unpaid",
  other: "Other",
};

interface ProfileData {
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
}

export function AdminTeam() {
  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [selected, setSelected] = useState<Member | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [copied, setCopied] = useState(false);

  // Add-employee dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ data: companyData }, { data: roster }] = await Promise.all([
        api.get<Company>("/companies/me"),
        api.get<Member[]>("/companies/members"),
      ]);
      setCompany(companyData);
      setMembers(roster);
    } catch (err) {
      toast.error(apiError(err));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<Company>("/companies/me"),
      api.get<Member[]>("/companies/members"),
    ])
      .then(([{ data: companyData }, { data: roster }]) => {
        if (cancelled) return;
        setCompany(companyData);
        setMembers(roster);
      })
      .catch((err) => {
        if (!cancelled) toast.error(apiError(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Select an employee and reset the profile so the loading state shows.
  const selectMember = (member: Member) => {
    setSelected(member);
    setProfile(null);
  };

  // Fetch the selected employee's attendance + leave history.
  useEffect(() => {
    if (!selected || selected.status === "invited") return;
    let cancelled = false;
    Promise.all([
      api.get<AttendanceRecord[]>(`/attendance/member/${selected.id}`),
      api.get<LeaveRequest[]>(`/leaves/member/${selected.id}`),
    ])
      .then(([attendance, leaves]) => {
        if (!cancelled)
          setProfile({ attendance: attendance.data, leaves: leaves.data });
      })
      .catch((err) => toast.error(apiError(err)));
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const month = todayLocal().slice(0, 7);

  const profileSummary = useMemo(() => {
    const records = profile?.attendance ?? [];
    const monthRecords = records.filter((r) => r.date.startsWith(month));
    const daysPresent = monthRecords.length;
    const totalHours = monthRecords.reduce(
      (sum, r) => (r.clockOut ? sum + hoursBetween(r.clockIn, r.clockOut) : sum),
      0,
    );
    const pending = (profile?.leaves ?? []).filter(
      (l) => l.status === "pending",
    ).length;
    return { daysPresent, totalHours, pending };
  }, [profile, month]);

  const copyCode = async () => {
    if (!company) return;
    try {
      await navigator.clipboard.writeText(company.code);
      setCopied(true);
      toast.success("Company code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — code: " + company.code);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post("/companies/members", { name: addName, email: addEmail });
      toast.success(
        `Employee added — an invite email is on its way to ${addEmail.trim().toLowerCase()}`,
      );
      setAddOpen(false);
      setAddName("");
      setAddEmail("");
      await load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setAdding(false);
    }
  };

  const employees = members?.filter((m) => m.role === "user") ?? [];
  const activeEmployees = employees.filter((m) => m.status === "active");
  const invitedEmployees = employees.filter((m) => m.status === "invited");

  return (
    <div>
      <SectionHeading
        eyebrow="Team"
        title="Employees"
        description="Add people by name and email — no join code needed. They appear here the moment they sign in."
        action={
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="size-4" />
            Add employee
          </Button>
        }
      />

      {/* Company + join code (kept as an alternative invite path) */}
      <div className="mb-6 flex flex-col gap-4 border-2 border-foreground bg-card p-5 shadow-brutal-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center border-2 border-foreground bg-primary text-primary-foreground shadow-brutal-sm">
            <KeyRound className="size-6" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Company join code
            </p>
            <p className="font-mono text-2xl font-black tracking-[0.25em]">
              {company?.code ?? "······"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="max-w-[220px] text-xs font-semibold leading-snug text-muted-foreground">
            Prefer self-serve? Share this code — employees join instantly on
            sign-up.
          </p>
          <Button variant="outline" onClick={copyCode} disabled={!company}>
            {copied ? (
              <>
                <Check className="size-4" strokeWidth={3} /> Copied
              </>
            ) : (
              <>
                <Copy className="size-4" /> Copy code
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="border-2 border-foreground bg-card shadow-brutal-lg">
        <div className="flex items-center justify-between border-b-2 border-foreground bg-secondary px-6 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Team roster
          </p>
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground">
            <Users className="size-4" />
            {members?.length ?? 0}
          </div>
        </div>
        {members && members.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Member</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow
                  key={member.id}
                  className="cursor-pointer hover:bg-secondary/40"
                  onClick={() => selectMember(member)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 rounded-none border-2 border-foreground">
                        <AvatarFallback className="rounded-none bg-primary text-xs font-black text-primary-foreground">
                          {initials(member.name ?? undefined, member.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-bold">
                        {member.name || "Unnamed"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden font-semibold text-muted-foreground sm:table-cell">
                    {member.email}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={member.role === "admin" ? "admin" : "employee"}
                    />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {member.status === "invited" ? (
                      <StatusBadge status="invited" />
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">
                        {new Date(member.joinedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectMember(member);
                      }}
                    >
                      <Eye className="size-4" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : members === null ? (
          <div className="flex items-center justify-center gap-3 py-14">
            <Loader2 className="size-5 animate-spin text-primary" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Loading…
            </p>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              title="No employees yet"
              text="Add your first employee by name and email — they'll appear here once they sign in."
              icon={<Users className="size-8" />}
            />
          </div>
        )}
      </div>

      {activeEmployees.length === 0 && invitedEmployees.length === 0 ? null : (
        <p className="mt-4 text-xs font-semibold text-muted-foreground">
          {activeEmployees.length > 0
            ? `${activeEmployees.length} active employee${activeEmployees.length === 1 ? "" : "s"}`
            : null}
          {activeEmployees.length > 0 && invitedEmployees.length > 0 ? " · " : ""}
          {invitedEmployees.length > 0
            ? `${invitedEmployees.length} invited (not signed in yet)`
            : null}
        </p>
      )}

      {/* Add employee dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md border-2 border-foreground shadow-brutal-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight">
              Add an employee
            </DialogTitle>
            <DialogDescription className="font-medium">
              They'll get access to this company automatically the moment they
              sign in with this email. No code needed.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="new-name"
                className="text-xs font-black uppercase tracking-widest"
              >
                Full name
              </Label>
              <Input
                id="new-name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                required
                minLength={2}
                maxLength={60}
                disabled={adding}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="new-email"
                className="text-xs font-black uppercase tracking-widest"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="new-email"
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-9"
                  required
                  disabled={adding}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setAddOpen(false)}
                disabled={adding}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={adding || addName.trim().length < 2 || !addEmail.trim()}
              >
                {adding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    Add employee
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Employee profile dialog */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setProfile(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-2 border-foreground shadow-brutal-lg">
          {selected ? (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="size-16 rounded-none border-2 border-foreground">
                    <AvatarFallback className="rounded-none bg-primary text-lg font-black text-primary-foreground">
                      {initials(selected.name ?? undefined, selected.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 pt-1">
                    <DialogTitle className="text-2xl font-black tracking-tight">
                      {selected.name || "Unnamed"}
                    </DialogTitle>
                    <DialogDescription className="mt-0.5 font-medium">
                      {selected.email}
                    </DialogDescription>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge
                        status={selected.role === "admin" ? "admin" : "employee"}
                      />
                      {selected.status === "invited" ? (
                        <StatusBadge status="invited" />
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground">
                          Joined{" "}
                          {new Date(selected.joinedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {selected.status === "invited" ? (
                <div className="pt-2">
                  <EmptyState
                    title="Waiting for sign-up"
                    text="This person was added by name and email. The moment they sign in with this email, they'll join automatically — no code needed."
                    icon={<UserPlus className="size-7" />}
                  />
                </div>
              ) : profile === null ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Loading profile…
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                      label="Days present"
                      value={String(profileSummary.daysPresent)}
                      sub={formatMonth(month)}
                      icon={<UserRound className="size-5" strokeWidth={2.5} />}
                      tone="orange"
                    />
                    <StatCard
                      label="Hours this month"
                      value={formatHours(profileSummary.totalHours)}
                      sub="total logged"
                      icon={<Clock4 className="size-5" strokeWidth={2.5} />}
                    />
                    <StatCard
                      label="Pending leave"
                      value={String(profileSummary.pending)}
                      sub="waiting on you"
                      icon={<CalendarCheck2 className="size-5" strokeWidth={2.5} />}
                    />
                  </div>

                  {/* Leave history */}
                  <div className="border-2 border-foreground bg-card">
                    <div className="border-b-2 border-foreground bg-secondary px-4 py-2.5">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        Leave history
                      </p>
                    </div>
                    {profile.leaves.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Dates</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {profile.leaves.slice(0, 6).map((leave) => (
                            <TableRow key={leave.id} className="hover:bg-secondary/40">
                              <TableCell className="text-sm font-bold">
                                {formatDay(leave.startDate)}
                                {leave.endDate !== leave.startDate
                                  ? ` → ${formatDate(leave.endDate)}`
                                  : ""}
                              </TableCell>
                              <TableCell className="text-sm font-semibold capitalize">
                                {TYPE_LABELS[leave.type] ?? leave.type}
                              </TableCell>
                              <TableCell className="text-right">
                                <StatusBadge status={leave.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-4">
                        <EmptyState
                          title="No leave yet"
                          text="This employee hasn't submitted any leave requests."
                          icon={<CalendarCheck2 className="size-7" />}
                        />
                      </div>
                    )}
                  </div>

                  {/* Recent punches */}
                  <div className="border-2 border-foreground bg-card">
                    <div className="border-b-2 border-foreground bg-secondary px-4 py-2.5">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        Recent punches
                      </p>
                    </div>
                    {profile.attendance.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Date</TableHead>
                            <TableHead>In</TableHead>
                            <TableHead>Out</TableHead>
                            <TableHead className="text-right">Hours</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {profile.attendance.slice(0, 6).map((record) => (
                            <TableRow key={record.id} className="hover:bg-secondary/40">
                              <TableCell className="text-sm font-bold">
                                {formatDay(record.date)}
                              </TableCell>
                              <TableCell className="text-sm font-semibold tabular-nums">
                                {formatTime(record.clockIn)}
                              </TableCell>
                              <TableCell className="text-sm font-semibold tabular-nums">
                                {record.clockOut ? formatTime(record.clockOut) : "—"}
                              </TableCell>
                              <TableCell className="text-right text-sm font-black tabular-nums">
                                {record.clockOut
                                  ? formatHours(
                                      hoursBetween(record.clockIn, record.clockOut),
                                    )
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-4">
                        <EmptyState
                          title="No punches yet"
                          text="This employee hasn't clocked in for this company."
                          icon={<Clock4 className="size-7" />}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
