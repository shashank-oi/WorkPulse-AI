import { Bell, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Notification = {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
};

export function EmployeeNotificationPopup() {
  const [notification, setNotification] =
    useState<Notification | null>(null);

  const checkNotifications = async () => {
    try {
      const response = await fetch(
        "/api/notifications/unread",
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        return;
      }

      const data: Notification[] = await response.json();

      if (data.length > 0) {
        setNotification(data[0]);
      }
    } catch {
      // Ignore polling errors
    }
  };

  useEffect(() => {
    checkNotifications();

    const interval = setInterval(
      checkNotifications,
      5000,
    );

    return () => clearInterval(interval);
  }, []);

  const closeNotification = async () => {
    if (!notification) {
      return;
    }

    try {
      await fetch(
        `/api/notifications/${notification.id}/read`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );
    } catch {
      // Ignore read-status errors
    }

    setNotification(null);
  };

  if (!notification) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-[380px] max-w-[calc(100vw-2rem)] border-2 border-foreground bg-card shadow-brutal-lg">
      <div className="flex items-center justify-between border-b-2 border-foreground bg-primary px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="size-5" />

          <span className="text-sm font-black uppercase">
            New Notification
          </span>
        </div>

        <button
          type="button"
          onClick={closeNotification}
          className="border-2 border-foreground p-1 hover:bg-secondary"
          aria-label="Close notification"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-black">
          {notification.title}
        </h3>

        <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-muted-foreground">
          {notification.message}
        </p>

        <p className="mt-3 text-xs font-bold text-muted-foreground">
          {new Date(
            notification.createdAt,
          ).toLocaleString()}
        </p>

        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={closeNotification}
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}