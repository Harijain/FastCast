package com.fastcast.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {
    private UUID id;
    private String token;
    private String refreshToken;
    private String email;
    private String name;
    private String role;
}