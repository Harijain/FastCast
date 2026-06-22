package com.fastcast.auth.service;

import com.fastcast.auth.dto.AuthResponse;
import com.fastcast.auth.dto.LoginRequest;
import com.fastcast.auth.dto.RegisterRequest;
import com.fastcast.user.entity.User;
import com.fastcast.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService unit tests")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(UUID.randomUUID())
                .name("Hari Jain")
                .email("hari@fastcast.com")
                .passwordHash("hashed_password")
                .role("USER")
                .build();
    }

    // ── Register tests ────────────────────────────────────────────────────────

    @Test
    @DisplayName("register — creates user and returns token when email is new")
    void register_newEmail_returnsTokenAndRefreshToken() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Hari Jain");
        request.setEmail("hari@fastcast.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("hari@fastcast.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtService.generateToken(any())).thenReturn("access.token.here");
        when(jwtService.generateRefreshToken(any())).thenReturn("refresh.token.here");

        AuthResponse response = authService.register(request);

        assertThat(response.getToken()).isEqualTo("access.token.here");
        assertThat(response.getRefreshToken()).isEqualTo("refresh.token.here");
        assertThat(response.getEmail()).isEqualTo("hari@fastcast.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("register — throws exception when email already registered")
    void register_duplicateEmail_throwsException() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Hari Jain");
        request.setEmail("hari@fastcast.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("hari@fastcast.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email already registered");

        verify(userRepository, never()).save(any());
    }

    // ── Login tests ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("login — returns token on valid credentials")
    void login_validCredentials_returnsToken() {
        LoginRequest request = new LoginRequest();
        request.setEmail("hari@fastcast.com");
        request.setPassword("password123");

        when(userRepository.findByEmail("hari@fastcast.com"))
                .thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("access.token.here");
        when(jwtService.generateRefreshToken(user)).thenReturn("refresh.token.here");

        AuthResponse response = authService.login(request);

        assertThat(response.getToken()).isEqualTo("access.token.here");
        assertThat(response.getEmail()).isEqualTo("hari@fastcast.com");
        verify(authenticationManager).authenticate(
                any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("login — throws exception on bad credentials")
    void login_badCredentials_throwsException() {
        LoginRequest request = new LoginRequest();
        request.setEmail("hari@fastcast.com");
        request.setPassword("wrongpassword");

        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager).authenticate(any());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    // ── Refresh tests ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("refresh — returns new tokens for valid refresh token")
    void refresh_validToken_returnsNewTokens() {
        when(jwtService.extractUsername("valid.refresh.token"))
                .thenReturn("hari@fastcast.com");
        when(userRepository.findByEmail("hari@fastcast.com"))
                .thenReturn(Optional.of(user));
        when(jwtService.isTokenValid("valid.refresh.token", user)).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("new.access.token");
        when(jwtService.generateRefreshToken(user)).thenReturn("new.refresh.token");

        AuthResponse response = authService.refresh("valid.refresh.token");

        assertThat(response.getToken()).isEqualTo("new.access.token");
        assertThat(response.getRefreshToken()).isEqualTo("new.refresh.token");
    }

    @Test
    @DisplayName("refresh — throws exception for invalid or expired refresh token")
    void refresh_invalidToken_throwsException() {
        when(jwtService.extractUsername("expired.token"))
                .thenReturn("hari@fastcast.com");
        when(userRepository.findByEmail("hari@fastcast.com"))
                .thenReturn(Optional.of(user));
        when(jwtService.isTokenValid("expired.token", user)).thenReturn(false);

        assertThatThrownBy(() -> authService.refresh("expired.token"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid or expired refresh token");
    }
}