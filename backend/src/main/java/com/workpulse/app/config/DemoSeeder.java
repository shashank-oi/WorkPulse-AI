package com.workpulse.app.config;

import com.workpulse.app.domain.AttendanceRecord;
import com.workpulse.app.domain.Company;
import com.workpulse.app.domain.LeaveRequest;
import com.workpulse.app.domain.LeaveStatus;
import com.workpulse.app.domain.LeaveType;
import com.workpulse.app.domain.Role;
import com.workpulse.app.domain.User;
import com.workpulse.app.domain.UserStatus;
import com.workpulse.app.repository.AttendanceRepository;
import com.workpulse.app.repository.CompanyRepository;
import com.workpulse.app.repository.LeaveRequestRepository;
import com.workpulse.app.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Seeds a demo company the first time the app starts with an empty database
 * (disable with {@code SEED_DEMO=false}):
 *
 * <pre>
 *   Admin:    demo@workpulse.ai   / password123
 *   Employee: demo2@workpulse.ai  / password123
 * </pre>
 */
@Component
public class DemoSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoSeeder.class);

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed-demo:true}")
    private boolean seedDemo;

    public DemoSeeder(
            UserRepository userRepository,
            CompanyRepository companyRepository,
            AttendanceRepository attendanceRepository,
            LeaveRequestRepository leaveRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.attendanceRepository = attendanceRepository;
        this.leaveRepository = leaveRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!seedDemo || userRepository.count() > 0) {
            return;
        }

        long now = System.currentTimeMillis();

        Company company = new Company();
        company.setName("WorkPulse Demo");
        company.setCode("DEMO01");
        company.setCreatedAt(now);
        companyRepository.save(company);

        User admin = new User();
        admin.setName("Demo Admin");
        admin.setEmail("demo@workpulse.ai");
        admin.setPasswordHash(passwordEncoder.encode("password123"));
        admin.setRole(Role.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setCompany(company);
        admin.setJoinedAt(now);
        userRepository.save(admin);

        User employee = new User();
        employee.setName("Demo Employee");
        employee.setEmail("demo2@workpulse.ai");
        employee.setPasswordHash(passwordEncoder.encode("password123"));
        employee.setRole(Role.USER);
        employee.setStatus(UserStatus.ACTIVE);
        employee.setCompany(company);
        employee.setJoinedAt(now);
        userRepository.save(employee);

        // A completed shift yesterday, so the admin's attendance view has data.
        ZoneId zone = ZoneId.systemDefault();
        LocalDate yesterday = LocalDate.now().minusDays(1);
        AttendanceRecord shift = new AttendanceRecord();
        shift.setUser(employee);
        shift.setCompany(company);
        shift.setDate(yesterday.toString());
        shift.setClockIn(yesterday.atTime(9, 0).atZone(zone).toInstant().toEpochMilli());
        shift.setClockOut(yesterday.atTime(17, 30).atZone(zone).toInstant().toEpochMilli());
        attendanceRepository.save(shift);

        // A pending leave request, so the admin's review queue is not empty.
        LeaveRequest leave = new LeaveRequest();
        leave.setUser(employee);
        leave.setCompany(company);
        leave.setStartDate(LocalDate.now().plusDays(7).toString());
        leave.setEndDate(LocalDate.now().plusDays(9).toString());
        leave.setType(LeaveType.ANNUAL);
        leave.setReason("Family vacation");
        leave.setStatus(LeaveStatus.PENDING);
        leave.setCreatedAt(now);
        leaveRepository.save(leave);

        log.info("Seeded demo company 'WorkPulse Demo' (code DEMO01) with demo@workpulse.ai / demo2@workpulse.ai");
    }
}
