package com.splitly.controller;

import com.splitly.dto.Dtos.*;
import com.splitly.entity.User;
import com.splitly.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository users;
    private final PasswordEncoder encoder;

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal User u) {
        return new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getAvatarUrl());
    }

    @PutMapping("/me")
    public UserResponse updateName(@AuthenticationPrincipal User u, @Valid @RequestBody UpdateNameRequest req) {
        u.setName(req.name());
        users.save(u);
        return new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getAvatarUrl());
    }

    @PutMapping("/me/password")
    public void updatePassword(@AuthenticationPrincipal User u, @Valid @RequestBody UpdatePasswordRequest req) {
        u.setPassword(encoder.encode(req.password()));
        users.save(u);
    }
}
