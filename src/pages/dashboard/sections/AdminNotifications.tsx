import {
  Bell,
  Check,
  Loader2,
  Send,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

type Employee = {
  id: number;
  name: string | null;
  email: string;
};

export function AdminNotifications() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [sendToAll, setSendToAll] = useState(true);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      setError("");

      const { data } = await api.get<Employee[]>(
        "/notifications/employees",
      );

      setEmployees(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load employees",
      );
    } finally {
      setLoadingEmployees(false);
    }
  };

  const toggleEmployee = (employeeId: number) => {
    setSelectedEmployees((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId],
    );
  };

  const handleSend = async () => {
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Please enter a notification title.");
      return;
    }

    if (!message.trim()) {
      setError("Please enter a notification message.");
      return;
    }

    if (!sendToAll && selectedEmployees.length === 0) {
      setError("Please select at least one employee.");
      return;
    }

    try {
      setSending(true);

      await api.post("/notifications", {
        title: title.trim(),
        message: message.trim(),
        sendToAll,
        employeeIds: sendToAll ? [] : selectedEmployees,
      });

      setSuccess("Notification sent successfully.");

      setTitle("");
      setMessage("");
      setSelectedEmployees([]);
      setSendToAll(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send notification",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Admin panel
        </p>

        <div className="mt-1 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center border-2 border-foreground bg-primary shadow-brutal-sm">
            <Bell className="size-5" />
          </div>

          <h1 className="text-3xl font-black tracking-tight">
            Notifications
          </h1>
        </div>

        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Send announcements and notifications to employees in
          your company.
        </p>
      </div>

      {/* Main notification box */}
      <div className="border-2 border-foreground bg-card shadow-brutal-sm">
        <div className="border-b-2 border-foreground bg-secondary px-5 py-4">
          <div className="flex items-center gap-2">
            <Send className="size-5" />

            <h2 className="text-lg font-black">
              Send Notification
            </h2>
          </div>

          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Choose who should receive this announcement.
          </p>
        </div>

        <div className="space-y-6 p-5">
          {/* Send target */}
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
              Send to
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* All employees */}
              <button
                type="button"
                onClick={() => {
                  setSendToAll(true);
                  setSelectedEmployees([]);
                }}
                className={`flex items-center gap-3 border-2 border-foreground p-4 text-left transition-all ${
                  sendToAll
                    ? "bg-primary text-primary-foreground shadow-brutal-sm"
                    : "bg-card hover:bg-secondary"
                }`}
              >
                <Users className="size-5" />

                <div>
                  <p className="font-black">
                    All Employees
                  </p>

                  <p
                    className={`text-xs font-medium ${
                      sendToAll
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    Send to everyone in this company
                  </p>
                </div>

                {sendToAll ? (
                  <Check className="ml-auto size-5" />
                ) : null}
              </button>

              {/* Selected employees */}
              <button
                type="button"
                onClick={() => setSendToAll(false)}
                className={`flex items-center gap-3 border-2 border-foreground p-4 text-left transition-all ${
                  !sendToAll
                    ? "bg-primary text-primary-foreground shadow-brutal-sm"
                    : "bg-card hover:bg-secondary"
                }`}
              >
                <Bell className="size-5" />

                <div>
                  <p className="font-black">
                    Selected Employees
                  </p>

                  <p
                    className={`text-xs font-medium ${
                      !sendToAll
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    Choose specific employees
                  </p>
                </div>

                {!sendToAll ? (
                  <Check className="ml-auto size-5" />
                ) : null}
              </button>
            </div>
          </div>

          {/* Employee list */}
          {!sendToAll ? (
            <div className="border-2 border-foreground bg-background">
              <div className="border-b-2 border-foreground px-4 py-3">
                <p className="text-xs font-black uppercase tracking-widest">
                  Select Employees
                </p>

                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {selectedEmployees.length} selected
                </p>
              </div>

              {loadingEmployees ? (
                <div className="flex items-center justify-center gap-2 p-6">
                  <Loader2 className="size-5 animate-spin" />
                  <span className="text-sm font-bold">
                    Loading employees...
                  </span>
                </div>
              ) : employees.length === 0 ? (
                <div className="p-6 text-center text-sm font-bold text-muted-foreground">
                  No employees found in this company.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {employees.map((employee) => {
                    const selected = selectedEmployees.includes(
                      employee.id,
                    );

                    return (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() =>
                          toggleEmployee(employee.id)
                        }
                        className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 ${
                          selected
                            ? "bg-secondary"
                            : "hover:bg-secondary"
                        }`}
                      >
                        <div
                          className={`flex size-5 items-center justify-center border-2 border-foreground ${
                            selected
                              ? "bg-primary"
                              : "bg-background"
                          }`}
                        >
                          {selected ? (
                            <Check className="size-3 text-primary-foreground" />
                          ) : null}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {employee.name || "Employee"}
                          </p>

                          <p className="truncate text-xs font-medium text-muted-foreground">
                            {employee.email}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {/* Title */}
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest">
              Notification Title
            </label>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              className="w-full border-2 border-foreground bg-background px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Message */}
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest">
              Message
            </label>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement or message..."
              rows={6}
              className="w-full resize-y border-2 border-foreground bg-background px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Error */}
          {error ? (
            <div className="border-2 border-destructive bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
              {error}
            </div>
          ) : null}

          {/* Success */}
          {success ? (
            <div className="border-2 border-foreground bg-secondary px-4 py-3 text-sm font-bold">
              ✓ {success}
            </div>
          ) : null}

          {/* Send button */}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="min-w-48"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" />
                  Send Notification
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}