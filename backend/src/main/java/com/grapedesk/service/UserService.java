package com.grapedesk.service;

import com.grapedesk.domain.Role;
import com.grapedesk.domain.User;
import com.grapedesk.dto.Dtos.*;
import com.grapedesk.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
public class UserService {
    private final UserRepository users;
    private final PasswordEncoder encoder;

    public List<UserResponse> listAll() {
        return users.findAll(Sort.by("name")).stream().map(UserResponse::of).toList();
    }

    public List<UserResponse> listStaff() {
        return users.findByRoleInAndActiveTrueOrderByNameAsc(Set.of(Role.TECHNICIAN, Role.ADMIN))
                .stream().map(UserResponse::of).toList();
    }

    public UserResponse create(CreateUserRequest req) {
        if (users.existsByEmailIgnoreCase(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um usuário com este e-mail");
        }
        User u = new User();
        u.setName(req.name());
        u.setEmail(req.email().toLowerCase());
        u.setPassword(encoder.encode(req.password()));
        u.setRole(req.role());
        u.setDepartment(req.department());
        return UserResponse.of(users.save(u));
    }

    public UserResponse setActive(Long id, boolean active) {
        User u = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
        u.setActive(active);
        return UserResponse.of(users.save(u));
    }

    public UserService(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }
}
