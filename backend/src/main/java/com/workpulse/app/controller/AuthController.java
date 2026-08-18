package com.workpulse.app.controller;

import com.workpulse.app.dto.AuthDtos.AuthResponse;
import com.workpulse.app.dto.AuthDtos.LoginRequest;
import com.workpulse.app.dto.AuthDtos.RegisterRequest;
import com.workpulse.app.dto.AuthDtos.UserDto;
import com.workpulse.app.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request) {

        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request) {

        return authService.login(request);
    }

    @GetMapping("/me")
    public UserDto me() {
        return authService.me();
    }

    /**
     * Activates an invited employee and sets their password.
     */
    @PostMapping("/set-password")
    public void setPassword(
            @Valid @RequestBody SetPasswordRequest request) {

        authService.setPassword(
                request.getToken(),
                request.getPassword()
        );
    }

    /**
     * Request body for employee account activation.
     */
    public static class SetPasswordRequest {

        private String token;
        private String password;

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}