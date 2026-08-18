package com.workpulse.app.service;

import com.workpulse.app.domain.Company;
import com.workpulse.app.domain.Role;
import com.workpulse.app.domain.User;
import com.workpulse.app.domain.UserStatus;
import com.workpulse.app.dto.CompanyDtos.AddMemberRequest;
import com.workpulse.app.dto.CompanyDtos.CompanyDto;
import com.workpulse.app.dto.CompanyDtos.CreateCompanyRequest;
import com.workpulse.app.dto.CompanyDtos.JoinCompanyRequest;
import com.workpulse.app.dto.CompanyDtos.MemberDto;
import com.workpulse.app.exception.ApiException;
import com.workpulse.app.repository.CompanyRepository;
import com.workpulse.app.repository.UserRepository;
import com.workpulse.app.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

@Service
public class CompanyService {

    /** Ambiguity-free alphabet for join codes (no 0/O/1/I). */
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    /** Invitation token validity: 24 hours. */
    private static final long INVITATION_TOKEN_VALIDITY_MS =
            24 * 60 * 60 * 1000L;

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final CurrentUser currentUser;
    private final EmailService emailService;

    public CompanyService(
            CompanyRepository companyRepository,
            UserRepository userRepository,
            CurrentUser currentUser,
            EmailService emailService) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.currentUser = currentUser;
        this.emailService = emailService;
    }

    /** Creates a company and promotes the caller to ADMIN. */
    @Transactional
    public CompanyDto create(CreateCompanyRequest request) {
        User user = currentUser.get();
        if (user.getCompany() != null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "You're already part of a company"
            );
        }

        Company company = new Company();
        company.setName(request.name().trim());
        company.setCode(generateCode());
        company.setCreatedAt(System.currentTimeMillis());
        companyRepository.save(company);

        user.setCompany(company);
        user.setRole(Role.ADMIN);
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        return CompanyDto.from(company);
    }

    /** Joins an existing company by its shareable code. */
    @Transactional
    public CompanyDto join(JoinCompanyRequest request) {
        User user = currentUser.get();

        if (user.getCompany() != null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "You're already part of a company"
            );
        }

        String code = request.code()
                .trim()
                .toUpperCase(Locale.ROOT);

        Company company = companyRepository.findByCode(code)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "No company found with that code"
                ));

        user.setCompany(company);
        user.setRole(Role.USER);
        userRepository.save(user);

        return CompanyDto.from(company);
    }

    @Transactional(readOnly = true)
    public CompanyDto me() {
        User user = currentUser.get();

        if (user.getCompany() == null) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "You're not part of a company yet"
            );
        }

        return CompanyDto.from(user.getCompany());
    }

    @Transactional(readOnly = true)
    public List<MemberDto> members() {
        User user = currentUser.get();
        Company company = currentUser.requireCompany(user);

        return userRepository
                .findByCompanyIdOrderByIdAsc(company.getId())
                .stream()
                .map(MemberDto::from)
                .toList();
    }

    /**
     * Adds an employee by name + email (ADMIN only — enforced by
     * {@code @PreAuthorize} in the controller too).
     *
     * The new employee starts in INVITED state.
     * A secure invitation token is generated and expires after 24 hours.
     * An invite email is then sent to the employee.
     */
    @Transactional
    public MemberDto addMember(AddMemberRequest request) {

        User admin = currentUser.get();

        Company company = currentUser.requireCompany(admin);

        if (admin.getRole() != Role.ADMIN) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only admins can add employees"
            );
        }

        String email =
                com.workpulse.app.service.AuthService
                        .normalizeEmail(request.email());

        String name = request.name().trim();

        userRepository.findByEmailIgnoreCase(email)
                .ifPresent(existing -> {

                    if (currentUser.isInCompany(company, existing)) {
                        throw new ApiException(
                                HttpStatus.CONFLICT,
                                "Someone with this email is already part of your company"
                        );
                    }

                    throw new ApiException(
                            HttpStatus.CONFLICT,
                            "This email already belongs to another company"
                    );
                });

        User user = new User();

        user.setEmail(email);
        user.setName(StringUtils.hasText(name) ? name : null);
        user.setRole(Role.USER);
        user.setStatus(UserStatus.INVITED);
        user.setCompany(company);
        user.setJoinedAt(System.currentTimeMillis());

        // Generate a secure invitation token.
        String invitationToken = generateInvitationToken();

        user.setInvitationToken(invitationToken);

        // Token expires after 24 hours.
        user.setInvitationTokenExpiresAt(
                System.currentTimeMillis()
                        + INVITATION_TOKEN_VALIDITY_MS
        );

        userRepository.save(user);

        emailService.sendInvite(user, company);

        return MemberDto.from(user);
    }

    /**
     * Generates a cryptographically secure invitation token.
     */
    private String generateInvitationToken() {

        byte[] tokenBytes = new byte[32];

        RANDOM.nextBytes(tokenBytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(tokenBytes);
    }

    private String generateCode() {
        StringBuilder code;

        do {
            code = new StringBuilder(CODE_LENGTH);

            for (int i = 0; i < CODE_LENGTH; i++) {
                code.append(
                        CODE_ALPHABET.charAt(
                                RANDOM.nextInt(
                                        CODE_ALPHABET.length()
                                )
                        )
                );
            }

        } while (
                companyRepository
                        .findByCode(code.toString())
                        .isPresent()
        );

        return code.toString();
    }
}