import {
  CalendarCheck2,
  Check,
  ClipboardList,
  Loader2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/format";
import api, { apiError, type LeaveRequest } from "@/lib/api";
import { EmptyState, SectionHeading, StatusBadge } from "../ui";

const FILTERS = ["all", "pending", "approved", "rejected"] as const;

const TYPE_LABELS: Record<string, string> = {
  annual: "Annual",
  sick: "Sick",
  personal: "Personal",
  unpaid: "Unpaid",
  other: "Other",
};

export function AdminLeaves() {
  const [companyLeaves, setCompanyLeaves] = useState<LeaveRequest[] | null>(null);

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [reviewing, setReviewing] = useState<{
    id: number;
    employee: string;
    dates: string;
    status: "approved" | "rejected";
  } | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<LeaveRequest[]>("/leaves");
      setCompanyLeaves(data);
    } catch (err) {
      toast.error(apiError(err));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<LeaveRequest[]>("/leaves")
      .then(({ data }) => {
        if (!cancelled) setCompanyLeaves(data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(apiError(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingCount =
    companyLeaves?.filter((l) => l.status === "pending").length ?? 0;
  const filtered = (companyLeaves ?? []).filter((l) =>
    filter === "all" ? true : l.status === filter,
  );

  const openReview = (
    leave: LeaveRequest,
    status: "approved" | "rejected",
  ) => {
    setNote("");
    setReviewing({
      id: leave.id,
      employee: leave.name || leave.email || "",
      dates: `${formatDate(leave.startDate)} → ${formatDate(leave.endDate)}`,
      status,
    });
  };

  const confirmReview = async () => {
    if (!reviewing) return;
    setSubmitting(true);
    try {
      await api.post(`/leaves/${reviewing.id}/review`, {
        status: reviewing.status,
        note,
      });
      toast.success(
        reviewing.status === "approved" ? "Leave approved" : "Leave rejected",
      );
      setReviewing(null);
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
        eyebrow="Leave management"
        title="Leave requests"
        description="Review and respond to your team's time-off requests."
        action={
          <div className="flex items-center gap-2 border-2 border-foreground bg-secondary px-3 py-2 shadow-brutal-sm">
            <ClipboardList className="size-4" />
            <span className="text-xs font-black uppercase tracking-widest">
              {pendingCount} pending
            </span>
          </div>
        }
      />

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "border-2 border-foreground px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-all",
              filter === f
                ? "bg-foreground text-background shadow-brutal-sm"
                : "bg-card text-foreground hover:bg-secondary",
            )}
          >
            {f}
            {f === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      <div className="border-2 border-foreground bg-card shadow-brutal-lg">
        {companyLeaves === null ? (
          <div className="flex items-center justify-center gap-3 py-14">
            <Loader2 className="size-5 animate-spin text-primary" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Loading…
            </p>
          </div>
        ) : filtered.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Employee</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden lg:table-cell">Reason</TableHead>
                <TableHead className="hidden md:table-cell">Submitted</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((leave) => (
                <TableRow key={leave.id} className="hover:bg-secondary/40">
                  <TableCell>
                    <div className="font-bold">{leave.name || "—"}</div>
                    <div className="text-xs font-semibold text-muted-foreground">
                      {leave.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-semibold">
                    {formatDate(leave.startDate)}
                    {leave.endDate !== leave.startDate
                      ? ` → ${formatDate(leave.endDate)}`
                      : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="uppercase">
                      {TYPE_LABELS[leave.type] ?? leave.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden max-w-[240px] truncate text-sm text-muted-foreground lg:table-cell">
                    {leave.reason}
                  </TableCell>
                  <TableCell className="hidden text-sm font-semibold tabular-nums text-muted-foreground md:table-cell">
                    {formatTime(leave.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {leave.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => openReview(leave, "approved")}
                          className="bg-[#22c55e] hover:bg-[#16a34a]"
                        >
                          <Check className="size-4" strokeWidth={3} />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openReview(leave, "rejected")}
                        >
                          <X className="size-4" strokeWidth={3} />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <StatusBadge status={leave.status} />
                        {leave.reviewNote ? (
                          <span
                            className="hidden cursor-help text-xs font-semibold text-muted-foreground underline decoration-dotted lg:inline"
                            title={leave.reviewNote}
                          >
                            note
                          </span>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState
              title={filter === "pending" ? "Nothing waiting" : "No requests"}
              text={
                filter === "pending"
                  ? "All leave requests have been reviewed. Nice work."
                  : "No leave requests match this filter yet."
              }
              icon={<CalendarCheck2 className="size-8" />}
            />
          </div>
        )}
      </div>

      {/* Review dialog */}
      <Dialog
        open={reviewing !== null}
        onOpenChange={(open) => {
          if (!open && !submitting) setReviewing(null);
        }}
      >
        <DialogContent className="border-2 border-foreground shadow-brutal-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight">
              {reviewing?.status === "approved"
                ? "Approve leave"
                : "Reject leave"}
            </DialogTitle>
            <DialogDescription className="font-medium">
              {reviewing?.employee} · {reviewing?.dates}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <p className="text-xs font-black uppercase tracking-widest">
              Note to employee{" "}
              <span className="text-muted-foreground">(optional)</span>
            </p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                reviewing?.status === "rejected"
                  ? "e.g. Coverage isn't available that week."
                  : "e.g. Enjoy your time off!"
              }
              rows={3}
              maxLength={300}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewing(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReview}
              disabled={submitting}
              className={
                reviewing?.status === "rejected"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-[#22c55e] hover:bg-[#16a34a]"
              }
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : reviewing?.status === "approved" ? (
                <>
                  <Check className="size-4" strokeWidth={3} /> Confirm approval
                </>
              ) : (
                <>
                  <X className="size-4" strokeWidth={3} /> Confirm rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
