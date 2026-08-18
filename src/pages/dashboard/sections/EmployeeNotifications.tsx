import {
  Bell,
  Check,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

type Notification = {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
};

export function EmployeeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      setError("");

      const { data } = await api.get<Notification[]>(
        "/notifications",
      );

      setNotifications(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load notifications",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(loadNotifications, 10000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(
        `/notifications/${id}/read`,
      );

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notification",
      );
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          My workspace
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
          Notifications and announcements from your company admin.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center border-2 border-foreground bg-card p-10 shadow-brutal-sm">
          <Loader2 className="mr-2 size-5 animate-spin" />
          <span className="text-sm font-bold">
            Loading notifications...
          </span>
        </div>
      ) : error ? (
        <div className="border-2 border-destructive bg-destructive/10 p-4 text-sm font-bold text-destructive">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="border-2 border-foreground bg-card p-10 text-center shadow-brutal-sm">
          <Bell className="mx-auto size-10 text-muted-foreground" />

          <h2 className="mt-3 text-lg font-black">
            No notifications
          </h2>

          <p className="mt-1 text-sm font-medium text-muted-foreground">
            You don't have any notifications yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border-2 border-foreground bg-card p-5 shadow-brutal-sm ${
                notification.read
                  ? ""
                  : "bg-secondary"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center border-2 border-foreground bg-primary">
                  <Bell className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-black">
                      {notification.title}
                    </h2>

                    {!notification.read ? (
                      <span className="border-2 border-foreground bg-primary px-2 py-1 text-[10px] font-black uppercase">
                        New
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-muted-foreground">
                    {notification.message}
                  </p>

                  <p className="mt-3 text-xs font-bold text-muted-foreground">
                    {new Date(
                      notification.createdAt,
                    ).toLocaleString()}
                  </p>
                </div>

                {!notification.read ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      markAsRead(notification.id)
                    }
                  >
                    <Check className="mr-2 size-4" />
                    Read
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
