package com.grapedesk.service;

import com.grapedesk.config.JwtService;
import com.grapedesk.domain.User;
import com.grapedesk.dto.Dtos.*;
import com.grapedesk.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public LoginResponse login(LoginRequest req) {
        User user = users.findByEmailIgnoreCase(req.email())
                .filter(User::isActive)
                .filter(u -> encoder.matches(req.password(), u.getPassword()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos"));
        return new LoginResponse(jwt.generate(user), UserResponse.of(user));
    }

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }
}
