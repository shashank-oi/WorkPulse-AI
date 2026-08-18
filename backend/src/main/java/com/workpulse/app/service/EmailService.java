package com.workpulse.app.service;

import com.workpulse.app.domain.Company;
import com.workpulse.app.domain.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class EmailService {

    private static final Logger log =
            LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    /*
     * Read the Spring Mail configuration.
     * Defaults to Gmail SMTP so MAIL_HOST does not become empty.
     */
    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${MAIL_FROM:}")
    private String mailFrom;

    public EmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    /**
     * Sends an invitation email to an invited employee.
     */
    public void sendInvite(User invitedUser, Company company) {

        if (!StringUtils.hasText(mailHost)) {
            log.warn(
                    "MAIL_HOST not configured — skipping invite email to {}",
                    invitedUser.getEmail()
            );
            return;
        }

        JavaMailSender sender =
                mailSenderProvider.getIfAvailable();

        if (sender == null) {
            log.warn(
                    "No JavaMailSender configured — skipping invite email to {}",
                    invitedUser.getEmail()
            );
            return;
        }

        try {

            /*
             * Invitation link containing the secure token.
             */
            String link =
                    frontendUrl
                            + "/set-password?token="
                            + invitedUser.getInvitationToken();

            MimeMessage message =
                    sender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(
                            message,
                            "UTF-8"
                    );

            /*
             * Use configured sender.
             * If MAIL_FROM is not provided, use the Gmail username.
             */
            String from =
                    StringUtils.hasText(mailFrom)
                            ? mailFrom
                            : mailUsername;

            if (!StringUtils.hasText(from)) {
                from = "WorkPulse AI <no-reply@workpulse.local>";
            }

            helper.setFrom(from);

            helper.setTo(
                    invitedUser.getEmail()
            );

            helper.setSubject(
                    "You're invited to "
                            + company.getName()
                            + " on WorkPulse AI"
            );

            helper.setText("""
                    Hi %s,

                    %s added you to their company on WorkPulse AI.

                    Click the link below to activate your account
                    and set your password:

                    %s

                    This invitation link is valid for 24 hours.

                    — The WorkPulse AI team
                    """.formatted(
                    invitedUser.getName() == null
                            ? "there"
                            : invitedUser.getName(),
                    company.getName(),
                    link
            ));

            sender.send(message);

            log.info(
                    "Invite email sent successfully to {}",
                    invitedUser.getEmail()
            );

        } catch (MessagingException e) {

            log.error(
                    "Failed to send invite email to {}: {}",
                    invitedUser.getEmail(),
                    e.getMessage(),
                    e
            );

        } catch (Exception e) {

            log.error(
                    "Unexpected error while sending invite email to {}: {}",
                    invitedUser.getEmail(),
                    e.getMessage(),
                    e
            );
        }
    }
}