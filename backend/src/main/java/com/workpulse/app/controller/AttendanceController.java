package com.workpulse.app.controller;

import com.workpulse.app.dto.AttendanceDtos.AttendanceDto;
import com.workpulse.app.dto.AttendanceDtos.ClockRequest;
import com.workpulse.app.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/clock-in")
    public AttendanceDto clockIn(@Valid @RequestBody ClockRequest request) {
        return attendanceService.clockIn(request);
    }

    @PostMapping("/clock-out")
    public AttendanceDto clockOut(@Valid @RequestBody ClockRequest request) {
        return attendanceService.clockOut(request);
    }

    @GetMapping("/my")
    public List<AttendanceDto> my() {
        return attendanceService.my();
    }

    /** Company punches for a day — any company member can see it. */
    @GetMapping("/day")
    public List<AttendanceDto> day(@RequestParam(required = false) String date) {
        return attendanceService.day(date);
    }

    /** One employee's history — admin only. */
    @GetMapping("/member/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AttendanceDto> member(@PathVariable Long id) {
        return attendanceService.memberAttendance(id);
    }
}
