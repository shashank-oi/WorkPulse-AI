package com.workpulse.app.controller;

import com.workpulse.app.domain.User;
import com.workpulse.app.dto.NotificationResponse;
import com.workpulse.app.dto.SendNotificationRequest;
import com.workpulse.app.repository.UserRepository;
import com.workpulse.app.security.CurrentUser;
import com.workpulse.app.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUser currentUser;
    private final UserRepository userRepository;

    public NotificationController(
            NotificationService notificationService,
            CurrentUser currentUser,
            UserRepository userRepository
    ) {
        this.notificationService = notificationService;
        this.currentUser = currentUser;
        this.userRepository = userRepository;
    }

    /**
     * Get employees belonging to the logged-in admin's company.
     */
    @GetMapping("/employees")
    public ResponseEntity<List<User>> getCompanyEmployees() {

        User admin = currentUser.get();

        var company = currentUser.requireCompany(admin);

        List<User> employees =
                userRepository.findByCompanyIdOrderByIdAsc(
                        company.getId()
                );

        employees.removeIf(user ->
                user.getId().equals(admin.getId())
        );

        return ResponseEntity.ok(employees);
    }

    /**
     * Send notification to all or selected employees.
     */
    @PostMapping
    public ResponseEntity<Void> sendNotification(
            @Valid @RequestBody SendNotificationRequest request
    ) {

        if (request.isSendToAll()) {

            notificationService.sendToAllEmployees(
                    request.getTitle(),
                    request.getMessage()
            );

        } else {

            notificationService.sendToEmployees(
                    request.getTitle(),
                    request.getMessage(),
                    request.getEmployeeIds()
            );
        }

        return ResponseEntity.ok().build();
    }

    /**
     * Get notifications for the logged-in user.
     */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications() {

        List<NotificationResponse> notifications =
                notificationService
                        .getMyNotifications()
                        .stream()
                        .map(NotificationResponse::from)
                        .toList();

        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notifications.
     */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>>
    getUnreadNotifications() {

        List<NotificationResponse> notifications =
                notificationService
                        .getMyUnreadNotifications()
                        .stream()
                        .map(NotificationResponse::from)
                        .toList();

        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notification count.
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadCount() {

        return ResponseEntity.ok(
                notificationService.getUnreadCount()
        );
    }

    /**
     * Mark a notification as read.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id
    ) {

        notificationService.markAsRead(id);

        return ResponseEntity.ok().build();
    }
}
