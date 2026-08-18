package com.workpulse.app.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * One punch card: a single clock-in/clock-out pair for a user and a date.
 * The (user, date) pair is unique, so each employee has at most one record
 * per calendar day.
 */
@Entity
@Table(
        name = "attendance",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_attendance_user_date",
                columnNames = {"user_id", "date"}))
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Denormalized so admin queries never have to join through the user. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    /** Local calendar day, YYYY-MM-DD. */
    @Column(nullable = false, length = 10)
    private String date;

    /** Epoch millis when the employee clocked in. */
    @Column(nullable = false)
    private long clockIn;

    /** Epoch millis when the employee clocked out; null while the shift is open. */
    private Long clockOut;

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public long getClockIn() {
        return clockIn;
    }

    public void setClockIn(long clockIn) {
        this.clockIn = clockIn;
    }

    public Long getClockOut() {
        return clockOut;
    }

    public void setClockOut(Long clockOut) {
        this.clockOut = clockOut;
    }
}
