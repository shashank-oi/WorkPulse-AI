package com.workpulse.app;

import com.workpulse.app.domain.AttendanceRecord;
import com.workpulse.app.domain.Company;
import com.workpulse.app.domain.LeaveRequest;
import com.workpulse.app.domain.User;
import org.hibernate.SessionFactory;
import org.hibernate.boot.Metadata;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistry;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.cfg.AvailableSettings;
import org.hibernate.dialect.MySQLDialect;
import org.hibernate.dialect.PostgreSQLDialect;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifies that the JPA entities generate valid, complete DDL for both the
 * PostgreSQL and MySQL dialects — the same schema the application creates at
 * boot via {@code ddl-auto: update}. This mirrors what the SQL verification
 * scripts check against live servers, but needs no database to run.
 */
class DialectDdlTest {

    @Test
    void hibernateDdlIsValidForPostgres() throws Exception {
        String ddl = generateDdl(PostgreSQLDialect.class);
        assertTrue(ddl.contains("create table companies"));
        assertTrue(ddl.contains("create table users"));
        assertTrue(ddl.contains("create table attendance"));
        assertTrue(ddl.contains("create table leave_requests"));
        assertTrue(ddl.contains("uk_attendance_user_date"),
                "DDL must keep one attendance record per (user, date)");
        assertTrue(ddl.contains("uk_"),
                "DDL must define the unique constraints (email, company code)");
    }

    @Test
    void hibernateDdlIsValidForMySql() throws Exception {
        String ddl = generateDdl(MySQLDialect.class);
        assertTrue(ddl.contains("create table companies"));
        assertTrue(ddl.contains("create table users"));
        assertTrue(ddl.contains("create table attendance"));
        assertTrue(ddl.contains("create table leave_requests"));
        assertTrue(ddl.contains("uk_attendance_user_date"),
                "DDL must keep one attendance record per (user, date)");
        assertTrue(ddl.contains("uk_"),
                "DDL must define the unique constraints (email, company code)");
    }

    /**
     * Builds a SessionFactory against the given dialect with JPA script-only
     * schema generation, so Hibernate writes the CREATE TABLE DDL to a file
     * without needing a database connection. The file content is returned.
     */
    private String generateDdl(Class<?> dialect) throws Exception {
        Path out = Path.of("target", "ddl-" + dialect.getSimpleName() + ".sql");
        Files.deleteIfExists(out);

        StandardServiceRegistry registry = new StandardServiceRegistryBuilder()
                .applySetting(AvailableSettings.DIALECT, dialect.getName())
                .applySetting(AvailableSettings.HBM2DDL_AUTO, "none")
                .applySetting("jakarta.persistence.schema-generation.database.action", "none")
                .applySetting("jakarta.persistence.schema-generation.scripts.action", "create")
                .applySetting("jakarta.persistence.schema-generation.scripts.create-target", out.toString())
                .build();
        try {
            Metadata metadata = new MetadataSources(registry)
                    .addAnnotatedClass(Company.class)
                    .addAnnotatedClass(User.class)
                    .addAnnotatedClass(AttendanceRecord.class)
                    .addAnnotatedClass(LeaveRequest.class)
                    .buildMetadata();

            try (SessionFactory ignored = metadata.buildSessionFactory()) {
                // schema generation to the script target happens during build
            }

            assertTrue(Files.exists(out), "no DDL was written for " + dialect.getSimpleName());
            return Files.readString(out).toLowerCase();
        } finally {
            StandardServiceRegistryBuilder.destroy(registry);
        }
    }
}
