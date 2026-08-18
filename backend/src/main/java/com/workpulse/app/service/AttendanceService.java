package com.workpulse.app.service;

import com.workpulse.app.domain.AttendanceRecord;
import com.workpulse.app.domain.Company;
import com.workpulse.app.domain.User;
import com.workpulse.app.dto.AttendanceDtos.AttendanceDto;
import com.workpulse.app.dto.AttendanceDtos.ClockRequest;
import com.workpulse.app.exception.ApiException;
import com.workpulse.app.repository.AttendanceRepository;
import com.workpulse.app.repository.UserRepository;
import com.workpulse.app.security.CurrentUser;
import com.workpulse.app.util.Dates;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final CurrentUser currentUser;

    public AttendanceService(
            AttendanceRepository attendanceRepository,
            UserRepository userRepository,
            CurrentUser currentUser) {
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
        this.currentUser = currentUser;
    }

    @Transactional
    public AttendanceDto clockIn(ClockRequest request) {
        User user = currentUser.get();
        Company company = currentUser.requireCompany(user);
        String date = Dates.parse(request.date()).toString();

        attendanceRepository.findByUserIdAndDate(user.getId(), date).ifPresent(existing -> {
            if (existing.getClockOut() == null) {
                throw new ApiException(HttpStatus.CONFLICT, "You're already clocked in for this day");
            }
            throw new ApiException(HttpStatus.CONFLICT, "You've already clocked out for this day");
        });

        AttendanceRecord record = new AttendanceRecord();
        record.setUser(user);
        record.setCompany(company);
        record.setDate(date);
        record.setClockIn(System.currentTimeMillis());
        return AttendanceDto.from(attendanceRepository.save(record));
    }

    @Transactional
    public AttendanceDto clockOut(ClockRequest request) {
        User user = currentUser.get();
        currentUser.requireCompany(user);
        String date = Dates.parse(request.date()).toString();

        AttendanceRecord record = attendanceRepository.findByUserIdAndDate(user.getId(), date)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No clock-in found for this date"));
        if (record.getClockOut() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "You've already clocked out for this day");
        }
        record.setClockOut(System.currentTimeMillis());
        return AttendanceDto.from(attendanceRepository.save(record));
    }

    @Transactional(readOnly = true)
    public List<AttendanceDto> my() {
        User user = currentUser.get();
        return attendanceRepository.findByUserIdOrderByDateDescIdDesc(user.getId()).stream()
                .map(AttendanceDto::from)
                .toList();
    }

    /** Company punches for one calendar day — any company member can view it. */
    @Transactional(readOnly = true)
    public List<AttendanceDto> day(String date) {
        User user = currentUser.get();
        Company company = currentUser.requireCompany(user);
        String day = (date == null || date.isBlank())
                ? LocalDate.now().toString()
                : Dates.parse(date).toString();
        return attendanceRepository.findByCompanyIdAndDateOrderByIdAsc(company.getId(), day).stream()
                .map(AttendanceDto::from)
                .toList();
    }

    /** One employee's attendance history — admin only. */
    @Transactional(readOnly = true)
    public List<AttendanceDto> memberAttendance(Long memberId) {
        User admin = currentUser.get();
        Company company = currentUser.requireCompany(admin);
        User member = requireCompanyMember(company, memberId);
        return attendanceRepository
                .findByCompanyIdAndUserIdOrderByDateDescIdDesc(company.getId(), member.getId())
                .stream()
                .map(AttendanceDto::from)
                .toList();
    }

    private User requireCompanyMember(Company company, Long memberId) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));
        if (!currentUser.isInCompany(company, member)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Employee not found");
        }
        return member;
    }
}
