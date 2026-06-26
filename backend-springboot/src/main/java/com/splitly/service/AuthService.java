package com.splitly.service;

import com.splitly.dto.Dtos.*;
import com.splitly.entity.User;
import com.splitly.repository.UserRepository;
import com.splitly.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;

    public AuthResponse register(RegisterRequest req) {
        if (users.existsByEmail(req.email().toLowerCase()))
            throw new IllegalArgumentException("Email already in use");
        User u = User.builder()
            .name(req.name())
            .email(req.email().toLowerCase())
            .password(encoder.encode(req.password()))
            .build();
        u = users.save(u);
        return new AuthResponse(jwt.generate(u.getId(), u.getEmail()),
            new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getAvatarUrl()));
    }

    public AuthResponse login(LoginRequest req) {
        User u = users.findByEmail(req.email().toLowerCase())
            .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        if (!encoder.matches(req.password(), u.getPassword()))
            throw new IllegalArgumentException("Invalid credentials");
        return new AuthResponse(jwt.generate(u.getId(), u.getEmail()),
            new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getAvatarUrl()));
    }
}
