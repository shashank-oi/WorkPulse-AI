package com.workpulse.app.repository;

import com.workpulse.app.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    List<User> findByCompanyIdOrderByIdAsc(Long companyId);

    Optional<User> findByInvitationToken(String invitationToken);
}
