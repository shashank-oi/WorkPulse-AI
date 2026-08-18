package com.workpulse.app.service;

import com.workpulse.app.domain.Company;
import com.workpulse.app.domain.LeaveRequest;
import com.workpulse.app.domain.LeaveStatus;
import com.workpulse.app.domain.LeaveType;
import com.workpulse.app.domain.User;
import com.workpulse.app.dto.LeaveDtos.CreateLeaveRequest;
import com.workpulse.app.dto.LeaveDtos.LeaveDto;
import com.workpulse.app.dto.LeaveDtos.ReviewLeaveRequest;
import com.workpulse.app.exception.ApiException;
import com.workpulse.app.repository.LeaveRequestRepository;
import com.workpulse.app.repository.UserRepository;
import com.workpulse.app.security.CurrentUser;
import com.workpulse.app.util.Dates;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;

@Service
public class LeaveService {

    private final LeaveRequestRepository leaveRepository;
    private final UserRepository userRepository;
    private final CurrentUser currentUser;

    public LeaveService(
            LeaveRequestRepository leaveRepository,
            UserRepository userRepository,
            CurrentUser currentUser) {
        this.leaveRepository = leaveRepository;
        this.userRepository = userRepository;
        this.currentUser = currentUser;
    }

    @Transactional
    public LeaveDto apply(CreateLeaveRequest request) {
        User user = currentUser.get();
        Company company = currentUser.requireCompany(user);

        LeaveType type = LeaveType.fromApi(request.type())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Unknown leave type"));

        LocalDate startDate = Dates.parse(request.startDate());
        LocalDate endDate = Dates.parse(request.endDate());
        if (startDate.isAfter(endDate)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Start date must be on or before the end date");
        }
        if (!StringUtils.hasText(request.reason())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reason is required");
        }

        LeaveRequest leave = new LeaveRequest();
        leave.setUser(user);
        leave.setCompany(company);
        leave.setStartDate(startDate.toString());
        leave.setEndDate(endDate.toString());
        leave.setType(type);
        leave.setReason(request.reason().trim());
        leave.setStatus(LeaveStatus.PENDING);
        leave.setCreatedAt(System.currentTimeMillis());
        return LeaveDto.from(leaveRepository.save(leave));
    }

    @Transactional(readOnly = true)
    public List<LeaveDto> my() {
        User user = currentUser.get();
        return leaveRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(LeaveDto::from)
                .toList();
    }

    /** Every request in the company, with the employee's name — admin only. */
    @Transactional(readOnly = true)
    public List<LeaveDto> all() {
        User admin = currentUser.get();
        Company company = currentUser.requireCompany(admin);
        return leaveRepository.findByCompanyIdOrderByCreatedAtDesc(company.getId()).stream()
                .map(LeaveDto::from)
                .toList();
    }

    /** Approves or rejects a request — admin only. */
    @Transactional
    public LeaveDto review(Long leaveId, ReviewLeaveRequest request) {
        User admin = currentUser.get();
        Company company = currentUser.requireCompany(admin);

        LeaveRequest leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Leave request not found"));
        if (!currentUser.isInCompany(company, leave.getUser())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Leave request not found");
        }
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "This request has already been reviewed");
        }

        LeaveStatus status = LeaveStatus.fromApi(request.status())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Status must be 'approved' or 'rejected'"));
        if (status == LeaveStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Status must be 'approved' or 'rejected'");
        }

        leave.setStatus(status);
        leave.setReviewNote(StringUtils.hasText(request.note()) ? request.note().trim() : null);
        leave.setReviewedAt(System.currentTimeMillis());
        return LeaveDto.from(leaveRepository.save(leave));
    }

    /** One employee's leave history — admin only. */
    @Transactional(readOnly = true)
    public List<LeaveDto> memberLeaves(Long memberId) {
        User admin = currentUser.get();
        Company company = currentUser.requireCompany(admin);
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));
        if (!currentUser.isInCompany(company, member)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Employee not found");
        }
        return leaveRepository
                .findByCompanyIdAndUserIdOrderByCreatedAtDesc(company.getId(), member.getId())
                .stream()
                .map(LeaveDto::from)
                .toList();
    }
}
