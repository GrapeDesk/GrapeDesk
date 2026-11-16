package com.grapedesk.controller;

import com.grapedesk.domain.User;
import com.grapedesk.dto.Dtos.*;
import com.grapedesk.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) { return auth.login(req); }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal User user) { return UserResponse.of(user); }

    public AuthController(AuthService auth) {
        this.auth = auth;
    }
}
