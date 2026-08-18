package com.workpulse.app.repository;

import com.workpulse.app.domain.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    /** The employee's own requests, newest first. */
    List<LeaveRequest> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** Every request in the company, newest first (admin view). */
    List<LeaveRequest> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    /** One employee's requests within the company (admin profile view). */
    List<LeaveRequest> findByCompanyIdAndUserIdOrderByCreatedAtDesc(Long companyId, Long userId);
}
