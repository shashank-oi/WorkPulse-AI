import { CalendarPlus, CalendarX2, Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDay, todayLocal } from "@/lib/format";
import api, { apiError, type LeaveRequest } from "@/lib/api";
import { EmptyState, SectionHeading, StatusBadge } from "../ui";

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Annual",
  sick: "Sick",
  personal: "Personal",
  unpaid: "Unpaid",
  other: "Other",
};

type LeaveType = "annual" | "sick" | "personal" | "unpaid" | "other";

export function EmployeeLeaves() {
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[] | null>(null);

  const [type, setType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState(todayLocal());
  const [endDate, setEndDate] = useState(todayLocal());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<LeaveRequest[]>("/leaves/my");
      setMyLeaves(data);
    } catch (err) {
      toast.error(apiError(err));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<LeaveRequest[]>("/leaves/my")
      .then(({ data }) => {
        if (!cancelled) setMyLeaves(data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(apiError(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate > endDate) {
      toast.error("Start date must be on or before the end date");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/leaves", { type, startDate, endDate, reason });
      toast.success("Leave request submitted for review");
      setReason("");
      setStartDate(todayLocal());
      setEndDate(todayLocal());
      setType("annual");
      await load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <SectionHeading
        eyebrow="Leave"
        title="Apply for leave"
        description="Request time off and track its status here."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Apply form */}
        <form
          onSubmit={handleSubmit}
          className="h-fit border-2 border-foreground bg-card p-6 shadow-brutal-lg"
        >
          <div className="mb-4 flex size-11 items-center justify-center border-2 border-foreground bg-primary text-primary-foreground shadow-brutal-sm">
            <CalendarPlus className="size-5" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-black tracking-tight">New request</h3>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest">
                Leave type
              </Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as LeaveType)}
              >
                <SelectTrigger className="w-full border-2 border-foreground shadow-brutal-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-foreground shadow-brutal">
                  {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest">
                  From
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest">
                  To
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest">
                Reason
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you taking leave?"
                rows={3}
                maxLength={500}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !reason.trim()}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Send className="size-4" />
                  Submit request
                </>
              )}
            </Button>
          </div>
        </form>

        {/* History */}
        <div className="border-2 border-foreground bg-card shadow-brutal-lg">
          <div className="border-b-2 border-foreground bg-secondary px-6 py-3">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              My requests
            </p>
          </div>
          {myLeaves && myLeaves.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Dates</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Reason</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myLeaves.map((leave) => (
                  <TableRow key={leave.id} className="hover:bg-secondary/40">
                    <TableCell className="font-bold">
                      {formatDay(leave.startDate)}
                      {leave.endDate !== leave.startDate
                        ? ` → ${formatDate(leave.endDate)}`
                        : ""}
                    </TableCell>
                    <TableCell className="font-semibold capitalize">
                      {LEAVE_TYPE_LABELS[leave.type] ?? leave.type}
                    </TableCell>
                    <TableCell className="hidden max-w-[220px] truncate text-sm text-muted-foreground md:table-cell">
                      {leave.reason}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={leave.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : myLeaves === null ? (
            <div className="flex items-center justify-center gap-3 py-14">
              <Loader2 className="size-5 animate-spin text-primary" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Loading…
              </p>
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                title="No leave requests yet"
                text="Submit your first request with the form and it will appear here."
                icon={<CalendarX2 className="size-8" />}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
