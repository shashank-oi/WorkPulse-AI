package com.workpulse.app.controller;

import com.workpulse.app.dto.CompanyDtos.AddMemberRequest;
import com.workpulse.app.dto.CompanyDtos.CompanyDto;
import com.workpulse.app.dto.CompanyDtos.CreateCompanyRequest;
import com.workpulse.app.dto.CompanyDtos.JoinCompanyRequest;
import com.workpulse.app.dto.CompanyDtos.MemberDto;
import com.workpulse.app.service.CompanyService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @PostMapping
    public CompanyDto create(@Valid @RequestBody CreateCompanyRequest request) {
        return companyService.create(request);
    }

    @PostMapping("/join")
    public CompanyDto join(@Valid @RequestBody JoinCompanyRequest request) {
        return companyService.join(request);
    }

    @GetMapping("/me")
    public CompanyDto me() {
        return companyService.me();
    }

    @GetMapping("/members")
    public List<MemberDto> members() {
        return companyService.members();
    }

    @PostMapping("/members")
    @PreAuthorize("hasRole('ADMIN')")
    public MemberDto addMember(@Valid @RequestBody AddMemberRequest request) {
        return companyService.addMember(request);
    }
}
