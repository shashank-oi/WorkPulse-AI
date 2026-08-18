package com.workpulse.app.repository;

import com.workpulse.app.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    List<Notification> findByRecipientIdAndReadFalseOrderByCreatedAtDesc(
            Long recipientId
    );

    long countByRecipientIdAndReadFalse(Long recipientId);
}
