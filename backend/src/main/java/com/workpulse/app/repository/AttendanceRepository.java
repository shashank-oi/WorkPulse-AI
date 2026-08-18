package com.workpulse.app.repository;

import com.workpulse.app.domain.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {

    Optional<AttendanceRecord> findByUserIdAndDate(Long userId, String date);

    /** Own history, newest first. */
    List<AttendanceRecord> findByUserIdOrderByDateDescIdDesc(Long userId);

    /** Everyone's punches for one day in the company (admin day view). */
    List<AttendanceRecord> findByCompanyIdAndDateOrderByIdAsc(Long companyId, String date);

    /** One employee's history within the company (admin profile view). */
    List<AttendanceRecord> findByCompanyIdAndUserIdOrderByDateDescIdDesc(Long companyId, Long userId);
}
