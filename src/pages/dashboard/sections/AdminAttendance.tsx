import { CalendarDays, Clock4, Loader2, UserCheck, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDay,
  formatHours,
  formatTime,
  hoursBetween,
  todayLocal,
} from "@/lib/format";
import api, { apiError, type AttendanceRecord, type Member } from "@/lib/api";
import { EmptyState, SectionHeading, StatCard, StatusBadge } from "../ui";

export function AdminAttendance() {
  const [date, setDate] = useState(todayLocal());
  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [{ data: dayRecords }, { data: roster }] = await Promise.all([
        api.get<AttendanceRecord[]>("/attendance/day", { params: { date } }),
        api.get<Member[]>("/companies/members"),
      ]);
      setRecords(dayRecords);
      setMembers(roster);
      setError(null);
    } catch (err) {
      setError(apiError(err));
    }
  }, [date]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<AttendanceRecord[]>("/attendance/day", { params: { date } }),
      api.get<Member[]>("/companies/members"),
    ])
      .then(([{ data: dayRecords }, { data: roster }]) => {
        if (cancelled) return;
        setRecords(dayRecords);
        setMembers(roster);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(apiError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const totalEmployees = members?.length;

  const summary = useMemo(() => {
    const list = records ?? [];
    const present = list.filter((r) => r.clockIn).length;
    const completed = list.filter((r) => r.clockOut).length;
    const totalHours = list.reduce(
      (sum, r) => (r.clockOut ? sum + hoursBetween(r.clockIn, r.clockOut) : sum),
      0,
    );
    return { present, completed, totalHours };
  }, [records]);

  const notClockedIn = Math.max(0, (totalEmployees ?? 0) - summary.present);

  return (
    <div>
      <SectionHeading
        eyebrow="Attendance"
        title="Attendance overview"
        description="See who's in today — and how the day is shaping up."
        action={
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <Input
              type="date"
              value={date}
              max={todayLocal()}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="w-44 font-bold"
            />
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={formatDay(date)}
          value={`${summary.present}`}
          sub="clocked in"
          icon={<UserCheck className="size-5" strokeWidth={2.5} />}
          tone="orange"
        />
        <StatCard
          label="Not yet in"
          value={`${notClockedIn}`}
          sub={`of ${totalEmployees ?? "—"} employees`}
          icon={<Users className="size-5" strokeWidth={2.5} />}
        />
        <StatCard
          label="Completed shifts"
          value={`${summary.completed}`}
          sub="clocked out"
          icon={<Clock4 className="size-5" strokeWidth={2.5} />}
          tone="yellow"
        />
        <StatCard
          label="Hours logged"
          value={formatHours(summary.totalHours)}
          sub="company total"
          icon={<Clock4 className="size-5" strokeWidth={2.5} />}
          tone="dark"
        />
      </div>

      <div className="border-2 border-foreground bg-card shadow-brutal-lg">
        <div className="border-b-2 border-foreground bg-secondary px-6 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Attendance for {formatDay(date)}
          </p>
        </div>
        {error && records === null ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <p className="text-sm font-black uppercase tracking-widest">
              {error}
            </p>
            <button
              type="button"
              onClick={load}
              className="border-2 border-foreground bg-card px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-secondary"
            >
              Try again
            </button>
          </div>
        ) : records === null ? (
          <div className="flex items-center justify-center gap-3 py-14">
            <Loader2 className="size-5 animate-spin text-primary" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Loading…
            </p>
          </div>
        ) : records.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Employee</TableHead>
                <TableHead>Clock in</TableHead>
                <TableHead>Clock out</TableHead>
                <TableHead className="text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} className="hover:bg-secondary/40">
                  <TableCell>
                    <div className="font-bold">{record.name || "—"}</div>
                    <div className="text-xs font-semibold text-muted-foreground">
                      {record.email}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    {formatTime(record.clockIn)}
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    {record.clockOut ? formatTime(record.clockOut) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-black tabular-nums">
                        {record.clockOut
                          ? formatHours(
                              hoursBetween(record.clockIn, record.clockOut),
                            )
                          : "—"}
                      </span>
                      <StatusBadge
                        status={record.clockOut ? "present" : "pending"}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState
              title="No punches on this day"
              text={
                date === todayLocal()
                  ? "Nobody has clocked in yet today. The list fills up live."
                  : "No attendance was logged for this date."
              }
              icon={<Users className="size-8" />}
            />
          </div>
        )}
      </div>
    </div>
  );
}
