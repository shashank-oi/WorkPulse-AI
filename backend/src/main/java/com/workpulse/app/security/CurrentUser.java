package com.workpulse.app.security;

import com.workpulse.app.domain.Company;
import com.workpulse.app.domain.User;
import com.workpulse.app.exception.ApiException;
import com.workpulse.app.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Convenience access to the authenticated user. Must only be called from
 * within a service (ideally {@code @Transactional}) so lazy associations like
 * {@code company} can be loaded safely.
 */
@Component
public class CurrentUser {

    private final UserRepository userRepository;

    public CurrentUser(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long userId) {
            return userRepository.findById(userId)
                    .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Please log in again"));
        }
        throw new ApiException(HttpStatus.UNAUTHORIZED, "Please log in again");
    }

    /** Returns the user's company or throws 400 with a frontend-friendly message. */
    public Company requireCompany(User user) {
        if (user.getCompany() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Join or create a company first");
        }
        return user.getCompany();
    }

    /** Returns true when {@code member} belongs to {@code company}. */
    public boolean isInCompany(Company company, User member) {
        return member.getCompany() != null && company.getId().equals(member.getCompany().getId());
    }
}
