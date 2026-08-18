package com.workpulse.app.dto;

import com.workpulse.app.domain.Notification;

public class NotificationResponse {

    private Long id;
    private String title;
    private String message;
    private boolean read;
    private long createdAt;

    public NotificationResponse(
            Long id,
            String title,
            String message,
            boolean read,
            long createdAt
    ) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.read = read;
        this.createdAt = createdAt;
    }

    public static NotificationResponse from(
            Notification notification
    ) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public boolean isRead() {
        return read;
    }

    public long getCreatedAt() {
        return createdAt;
    }
}