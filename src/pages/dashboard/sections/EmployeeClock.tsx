import {
  AlarmClock,
  CalendarDays,
  Clock,
  LogIn,
  LogOut,
  Timer,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  formatHours,
  formatTime,
  formatTimeSeconds,
  hoursBetween,
  startOfWeek,
  toDateString,
  todayLocal,
} from "@/lib/format";
import api, { apiError, type AttendanceRecord } from "@/lib/api";
import { EmptyState, SectionHeading, StatCard } from "../ui";

export function EmployeeClock() {
  const [now, setNow] = useState(() => new Date());
  const today = todayLocal();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [punching, setPunching] = useState<"in" | "out" | null>(null);

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

  const todayRecord = useMemo(
    () => records?.find((r) => r.date === today),
    [records, today],
  );

  const weekHours = useMemo(() => {
    if (!records) return 0;
    const weekStartDate = toDateString(startOfWeek(now));
    return records.reduce((sum, r) => {
      if (r.clockOut && r.date >= weekStartDate) {
        return sum + hoursBetween(r.clockIn, r.clockOut);
      }
      return sum;
    }, 0);
  }, [records, now]);

  const monthDays = useMemo(() => {
    if (!records) return 0;
    const month = today.slice(0, 7);
    return records.filter((r) => r.date.startsWith(month)).length;
  }, [records, today]);

  const handleClockIn = async () => {
    setPunching("in");
    try {
      await api.post("/attendance/clock-in", { date: today });
      await load();
      toast.success(`Clocked in at ${formatTime(Date.now())}`);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setPunching(null);
    }
  };

  const handleClockOut = async () => {
    setPunching("out");
    try {
      await api.post("/attendance/clock-out", { date: today });
      await load();
      toast.success("Clocked out. Great shift!");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setPunching(null);
    }
  };

  const isClockedIn = Boolean(todayRecord && !todayRecord.clockOut);

  if (error && records === null) {
    return (
      <div>
        <SectionHeading
          eyebrow="Attendance"
          title="Clock in & out"
          description="Punch your attendance for today. One tap is all it takes."
        />
        <div className="flex flex-col items-center justify-center border-2 border-foreground bg-card px-6 py-14 text-center shadow-brutal-lg">
          <p className="text-sm font-black uppercase tracking-widest">{error}</p>
          <Button variant="outline" className="mt-4" onClick={load}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeading
        eyebrow="Attendance"
        title="Clock in & out"
        description="Punch your attendance for today. One tap is all it takes."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Punch card */}
        <div className="border-2 border-foreground bg-card shadow-brutal-lg">
          <div className="flex items-center justify-between border-b-2 border-foreground bg-secondary px-6 py-3">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Today's shift
            </p>
            <p className="text-xs font-black uppercase tracking-widest text-primary">
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex flex-col items-center px-6 py-10 text-center">
            <p className="text-6xl font-black tabular-nums tracking-tight sm:text-7xl">
              {formatTimeSeconds(now.getTime())}
            </p>
            <p className="mt-1 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Local time
            </p>

            <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
              {!todayRecord ? (
                <>
                  <Button
                    size="lg"
                    onClick={handleClockIn}
                    disabled={punching !== null}
                    className="h-14 text-lg"
                  >
                    {punching === "in" ? (
                      <span className="flex items-center gap-2">
                        <span className="size-2 animate-ping bg-foreground" />
                        Clocking in...
                      </span>
                    ) : (
                      <>
                        <LogIn className="size-5" />
                        Clock In
                      </>
                    )}
                  </Button>
                  <p className="text-sm font-medium text-muted-foreground">
                    You haven&apos;t clocked in today yet.
                  </p>
                </>
              ) : isClockedIn ? (
                <>
                  <div className="flex items-center justify-center gap-2 border-2 border-foreground bg-primary px-4 py-3 text-primary-foreground shadow-brutal-sm">
                    <Timer className="size-5" strokeWidth={2.5} />
                    <span className="text-sm font-black uppercase tracking-widest">
                      Clocked in at {formatTime(todayRecord.clockIn)}
                    </span>
                  </div>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleClockOut}
                    disabled={punching !== null}
                    className="h-14 text-lg"
                  >
                    {punching === "out" ? (
                      <span className="flex items-center gap-2">
                        <span className="size-2 animate-ping bg-foreground" />
                        Clocking out...
                      </span>
                    ) : (
                      <>
                        <LogOut className="size-5" />
                        Clock Out
                      </>
                    )}
                  </Button>
                  <p className="text-sm font-medium text-muted-foreground">
                    Shift so far:{" "}
                    <span className="font-black text-foreground">
                      {formatHours(
                        hoursBetween(todayRecord.clockIn, now.getTime()),
                      )}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <div className="border-2 border-foreground bg-secondary px-4 py-3 shadow-brutal-sm">
                    <p className="text-sm font-black uppercase tracking-widest">
                      Shift complete
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
                      {formatTime(todayRecord.clockIn)} →{" "}
                      {formatTime(todayRecord.clockOut!)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    You&apos;re all done for today. See you tomorrow!
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid content-start gap-4">
          <StatCard
            label="Today"
            value={
              todayRecord
                ? formatHours(
                    hoursBetween(
                      todayRecord.clockIn,
                      todayRecord.clockOut ?? now.getTime(),
                    ),
                  )
                : "—"
            }
            sub={todayRecord ? "worked so far" : "no punch yet"}
            icon={<AlarmClock className="size-5" strokeWidth={2.5} />}
            tone={isClockedIn ? "orange" : "white"}
          />
          <StatCard
            label="This week"
            value={formatHours(weekHours)}
            sub="total hours"
            icon={<Clock className="size-5" strokeWidth={2.5} />}
          />
          <StatCard
            label="This month"
            value={String(monthDays)}
            sub="days present"
            icon={<CalendarDays className="size-5" strokeWidth={2.5} />}
            tone="yellow"
          />

          {records && records.length === 0 ? (
            <EmptyState
              title="No attendance yet"
              text="Your clock-ins will show up here once you punch in."
              icon={<Clock className="size-8" />}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
