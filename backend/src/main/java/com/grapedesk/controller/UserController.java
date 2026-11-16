package com.grapedesk.controller;

import com.grapedesk.dto.Dtos.*;
import com.grapedesk.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> list() { return service.listAll(); }

    /** Técnicos e administradores (para atribuir chamados). */
    @GetMapping("/staff")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public List<UserResponse> staff() { return service.listStaff(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse create(@Valid @RequestBody CreateUserRequest req) { return service.create(req); }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse active(@PathVariable Long id, @RequestParam boolean value) { return service.setActive(id, value); }

    public UserController(UserService service) {
        this.service = service;
    }
}
