import { CalendarCheck2, CalendarDays, History, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
  formatMonth,
  formatTime,
  hoursBetween,
  todayLocal,
} from "@/lib/format";
import api, { apiError, type AttendanceRecord } from "@/lib/api";
import { EmptyState, SectionHeading, StatCard, StatusBadge } from "../ui";

export function EmployeeAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = todayLocal();
  const month = today.slice(0, 7);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<AttendanceRecord[]>("/attendance/my");
      setRecords(data);
      setError(null);
    } catch (err) {
      setError(apiError(err));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<AttendanceRecord[]>("/attendance/my")
      .then(({ data }) => {
        if (cancelled) return;
        setRecords(data);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(apiError(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const monthRecords = (records ?? []).filter((r) =>
      r.date.startsWith(month),
    );
    const daysPresent = monthRecords.length;
    const totalHours = monthRecords.reduce(
      (sum, r) => (r.clockOut ? sum + hoursBetween(r.clockIn, r.clockOut) : sum),
      0,
    );
    const avgHours = daysPresent > 0 ? totalHours / daysPresent : 0;
    return { daysPresent, totalHours, avgHours };
  }, [records, month]);

  return (
    <div>
      <SectionHeading
        eyebrow="Attendance"
        title="My attendance"
        description="Your clock-in history for this company — every punch, in one place."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Days present"
          value={String(summary.daysPresent)}
          sub={formatMonth(month)}
          icon={<CalendarDays className="size-5" strokeWidth={2.5} />}
          tone="orange"
        />
        <StatCard
          label="Hours this month"
          value={formatHours(summary.totalHours)}
          sub="total logged"
          icon={<CalendarCheck2 className="size-5" strokeWidth={2.5} />}
        />
        <StatCard
          label="Avg / day"
          value={formatHours(summary.avgHours)}
          sub="when present"
          tone="yellow"
        />
      </div>

      <div className="border-2 border-foreground bg-card shadow-brutal-lg">
        <div className="border-b-2 border-foreground bg-secondary px-6 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Recent records
          </p>
        </div>
        {records === null ? (
          error ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <p className="text-sm font-black uppercase tracking-widest">
                {error}
              </p>
              <Button variant="outline" onClick={load}>
                Try again
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 py-14">
              <Loader2 className="size-5 animate-spin text-primary" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Loading…
              </p>
            </div>
          )
        ) : records.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Clock in</TableHead>
                <TableHead>Clock out</TableHead>
                <TableHead className="text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const completed = Boolean(record.clockOut);
                return (
                  <TableRow key={record.id} className="hover:bg-secondary/40">
                    <TableCell className="font-bold">
                      {formatDay(record.date)}
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
                          {completed
                            ? formatHours(
                                hoursBetween(record.clockIn, record.clockOut!),
                              )
                            : "—"}
                        </span>
                        <StatusBadge
                          status={completed ? "present" : "pending"}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState
              title="No attendance yet"
              text="Your clock-ins will appear here once you start punching in."
              icon={<History className="size-8" />}
            />
          </div>
        )}
      </div>
    </div>
  );
}
