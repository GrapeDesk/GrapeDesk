package com.grapedesk.repository;

import com.grapedesk.domain.Role;
import com.grapedesk.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    List<User> findByRoleInAndActiveTrueOrderByNameAsc(Collection<Role> roles);
    List<User> findByRoleAndActiveTrue(Role role);
}
