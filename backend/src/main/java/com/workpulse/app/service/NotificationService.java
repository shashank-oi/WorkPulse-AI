package com.workpulse.app.service;

import com.workpulse.app.domain.Company;
import com.workpulse.app.domain.Notification;
import com.workpulse.app.domain.Role;
import com.workpulse.app.domain.User;
import com.workpulse.app.repository.NotificationRepository;
import com.workpulse.app.repository.UserRepository;
import com.workpulse.app.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.workpulse.app.exception.ApiException;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final CurrentUser currentUser;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            CurrentUser currentUser
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.currentUser = currentUser;
    }

    /**
     * Send notification to every employee in the admin's company.
     */
    @Transactional
    public void sendToAllEmployees(String title, String message) {

        User admin = requireAdmin();
        Company company = currentUser.requireCompany(admin);

        List<User> employees =
                userRepository.findByCompanyIdOrderByIdAsc(company.getId());

        long now = System.currentTimeMillis();

        for (User employee : employees) {

            if (employee.getRole() != Role.USER) {
                continue;
            }

            createNotification(
                    company,
                    admin,
                    employee,
                    title,
                    message,
                    now
            );
        }
    }

    /**
     * Send notification to selected employees.
     */
    @Transactional
    public void sendToEmployees(
            String title,
            String message,
            List<Long> employeeIds
    ) {

        User admin = requireAdmin();
        Company company = currentUser.requireCompany(admin);

        if (employeeIds == null || employeeIds.isEmpty()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Select at least one employee"
            );
        }

        long now = System.currentTimeMillis();

        for (Long employeeId : employeeIds) {

            User employee = userRepository.findById(employeeId)
                    .orElseThrow(() -> new ApiException(
                            HttpStatus.NOT_FOUND,
                            "Employee not found"
                    ));

            // IMPORTANT:
            // Employee must belong to the same company.
            if (!currentUser.isInCompany(company, employee)) {
                throw new ApiException(
                        HttpStatus.FORBIDDEN,
                        "You cannot send notifications to another company"
                );
            }

            // Only employees can receive employee notifications.
            if (employee.getRole() != Role.USER) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Selected user is not an employee"
                );
            }

            createNotification(
                    company,
                    admin,
                    employee,
                    title,
                    message,
                    now
            );
        }
    }

    /**
     * Get notifications belonging to the currently logged-in user.
     */
    @Transactional(readOnly = true)
    public List<Notification> getMyNotifications() {

        User user = currentUser.get();

        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(user.getId());
    }

    /**
     * Get unread notifications for the currently logged-in user.
     */
    @Transactional(readOnly = true)
    public List<Notification> getMyUnreadNotifications() {

        User user = currentUser.get();

        return notificationRepository
                .findByRecipientIdAndReadFalseOrderByCreatedAtDesc(
                        user.getId()
                );
    }

    /**
     * Get unread notification count.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount() {

        User user = currentUser.get();

        return notificationRepository
                .countByRecipientIdAndReadFalse(user.getId());
    }

    /**
     * Mark one notification as read.
     */
    @Transactional
    public void markAsRead(Long notificationId) {

        User user = currentUser.get();

        Notification notification =
                notificationRepository.findById(notificationId)
                        .orElseThrow(() -> new ApiException(
                                HttpStatus.NOT_FOUND,
                                "Notification not found"
                        ));

        // User can only modify their own notification.
        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "You cannot access this notification"
            );
        }

        notification.setRead(true);

        notificationRepository.save(notification);
    }

    /**
     * Create one notification for one employee.
     */
    private void createNotification(
            Company company,
            User sender,
            User recipient,
            String title,
            String message,
            long createdAt
    ) {

        Notification notification = new Notification();

        notification.setCompany(company);
        notification.setSender(sender);
        notification.setRecipient(recipient);
        notification.setTitle(title.trim());
        notification.setMessage(message.trim());
        notification.setRead(false);
        notification.setCreatedAt(createdAt);

        notificationRepository.save(notification);
    }

    /**
     * Make sure the current user is a company admin.
     */
    private User requireAdmin() {

        User user = currentUser.get();

        if (user.getRole() != Role.ADMIN) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only company admins can send notifications"
            );
        }

        return user;
    }
}
