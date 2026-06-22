package com.fastcast.common.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

@DisplayName("SanitizationUtil unit tests")
class SanitizationUtilTest {

    private SanitizationUtil sanitizationUtil;

    @BeforeEach
    void setUp() {
        sanitizationUtil = new SanitizationUtil();
    }

    @Test
    @DisplayName("sanitize — removes script tags from input")
    void sanitize_scriptTag_isRemoved() {
        String input = "<script>alert('xss')</script>Hello";
        String result = sanitizationUtil.sanitize(input);
        assertThat(result).doesNotContain("<script");
        assertThat(result).contains("Hello");
    }

    @Test
    @DisplayName("sanitize — removes javascript: protocol")
    void sanitize_javascriptProtocol_isRemoved() {
        String input = "javascript:void(0)";
        String result = sanitizationUtil.sanitize(input);
        assertThat(result).doesNotContain("javascript:");
    }

    @Test
    @DisplayName("sanitize — returns null for null input")
    void sanitize_nullInput_returnsNull() {
        assertThat(sanitizationUtil.sanitize(null)).isNull();
    }

    @Test
    @DisplayName("sanitizeTitle — truncates at 255 characters")
    void sanitizeTitle_longInput_truncatedAt255() {
        String longTitle = "A".repeat(300);
        String result = sanitizationUtil.sanitizeTitle(longTitle);
        assertThat(result.length()).isLessThanOrEqualTo(255);
    }

    @Test
    @DisplayName("sanitize — normal text passes through unchanged (modulo encoding)")
    void sanitize_normalText_passesThrough() {
        String input = "My Awesome Video 2024";
        String result = sanitizationUtil.sanitize(input);
        assertThat(result).isEqualTo("My Awesome Video 2024");
    }

    @Test
    @DisplayName("sanitize — onerror event handler is stripped")
    void sanitize_onErrorHandler_isStripped() {
        String input = "<img onerror=alert(1) src=x>";
        String result = sanitizationUtil.sanitize(input);
        assertThat(result).doesNotContain("onerror=");
    }
}