package com.fastcast.auth.service;

import com.fastcast.auth.dto.AuthResponse;
import com.fastcast.auth.dto.LoginRequest;
import com.fastcast.auth.dto.RegisterRequest;
import com.fastcast.user.entity.User;
import com.fastcast.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("USER")
                .build();

        user = userRepository.save(user);
        log.info("Registered new user: {}", user.getEmail());

        String token = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .id(user.getId())
                .token(token)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.getEmail()));

        String token = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.builder()
                .id(user.getId())
                .token(token)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }

    public AuthResponse refresh(String refreshToken) {
        String email = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        if (!jwtService.isTokenValid(refreshToken, user)) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        String newToken = jwtService.generateToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .id(user.getId())
                .token(newToken)
                .refreshToken(newRefreshToken)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }
}