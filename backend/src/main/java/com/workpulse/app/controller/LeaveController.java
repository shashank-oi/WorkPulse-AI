package com.workpulse.app.controller;

import com.workpulse.app.dto.LeaveDtos.CreateLeaveRequest;
import com.workpulse.app.dto.LeaveDtos.LeaveDto;
import com.workpulse.app.dto.LeaveDtos.ReviewLeaveRequest;
import com.workpulse.app.service.LeaveService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    @PostMapping
    public LeaveDto apply(@Valid @RequestBody CreateLeaveRequest request) {
        return leaveService.apply(request);
    }

    @GetMapping("/my")
    public List<LeaveDto> my() {
        return leaveService.my();
    }

    /** Every request in the company — admin only. */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<LeaveDto> all() {
        return leaveService.all();
    }

    @PostMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public LeaveDto review(@PathVariable Long id, @Valid @RequestBody ReviewLeaveRequest request) {
        return leaveService.review(id, request);
    }

    /** One employee's history — admin only. */
    @GetMapping("/member/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<LeaveDto> member(@PathVariable Long id) {
        return leaveService.memberLeaves(id);
    }
}
