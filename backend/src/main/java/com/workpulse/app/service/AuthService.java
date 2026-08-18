package com.workpulse.app.service;

import com.workpulse.app.config.JwtService;
import com.workpulse.app.domain.Role;
import com.workpulse.app.domain.User;
import com.workpulse.app.domain.UserStatus;
import com.workpulse.app.dto.AuthDtos.AuthResponse;
import com.workpulse.app.dto.AuthDtos.LoginRequest;
import com.workpulse.app.dto.AuthDtos.RegisterRequest;
import com.workpulse.app.dto.AuthDtos.UserDto;
import com.workpulse.app.exception.ApiException;
import com.workpulse.app.repository.UserRepository;
import com.workpulse.app.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentUser currentUser;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            CurrentUser currentUser) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public UserDto me() {
        return UserDto.from(currentUser.get());
    }

    /**
     * Creates a standalone account. If the email matches an admin-invited user,
     * the invite is claimed instead: the password is set, the account becomes
     * active and stays attached to the inviting company.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        String name = request.name() == null ? null : request.name().trim();

        Optional<User> existing =
                userRepository.findByEmailIgnoreCase(email);

        if (existing.isPresent()) {
            User invited = existing.get();

            if (invited.getStatus() == UserStatus.INVITED) {
                invited.setName(
                        StringUtils.hasText(name)
                                ? name
                                : invited.getName()
                );

                invited.setPasswordHash(
                        passwordEncoder.encode(request.password())
                );

                invited.setStatus(UserStatus.ACTIVE);

                userRepository.save(invited);

                return new AuthResponse(
                        jwtService.generate(invited),
                        UserDto.from(invited)
                );
            }

            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "An account with this email already exists. Try logging in."
            );
        }

        User user = new User();

        user.setEmail(email);
        user.setName(
                StringUtils.hasText(name)
                        ? name
                        : null
        );
        user.setPasswordHash(
                passwordEncoder.encode(request.password())
        );
        user.setRole(Role.USER);
        user.setStatus(UserStatus.ACTIVE);
        user.setJoinedAt(System.currentTimeMillis());

        userRepository.save(user);

        return new AuthResponse(
                jwtService.generate(user),
                UserDto.from(user)
        );
    }

    /**
     * Activates an invited employee using the secure invitation token
     * and sets their password.
     */
    @Transactional
    public void setPassword(String token, String password) {

        if (!StringUtils.hasText(token)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Invitation token is required"
            );
        }

        if (!StringUtils.hasText(password)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Password is required"
            );
        }

        User user = userRepository
                .findByInvitationToken(token)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid or expired invitation"
                ));

        /*
         * Make sure the invitation has not expired.
         */
        Long expiresAt = user.getInvitationTokenExpiresAt();

        if (expiresAt == null
                || System.currentTimeMillis() > expiresAt) {

            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "This invitation has expired"
            );
        }

        /*
         * The invitation should only activate an invited user.
         */
        if (user.getStatus() != UserStatus.INVITED) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "This invitation has already been used"
            );
        }

        /*
         * Set the employee's password.
         */
        user.setPasswordHash(
                passwordEncoder.encode(password)
        );

        /*
         * Activate the employee.
         */
        user.setStatus(UserStatus.ACTIVE);

        /*
         * Clear the invitation token so it cannot be reused.
         */
        user.setInvitationToken(null);
        user.setInvitationTokenExpiresAt(null);

        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {

        User user = userRepository
                .findByEmailIgnoreCase(
                        normalizeEmail(request.email())
                )
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"
                ));

        // Invited users have no password yet — always point them at sign-up so
        // they can claim the account (the frontend watches for the word "invited").
        if (user.getStatus() == UserStatus.INVITED) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "This email has been invited to a company — create your account to join it."
            );
        }

        if (!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash()
        )) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        return new AuthResponse(
                jwtService.generate(user),
                UserDto.from(user)
        );
    }

    static String normalizeEmail(String email) {
        return email == null
                ? null
                : email.trim().toLowerCase();
    }
}