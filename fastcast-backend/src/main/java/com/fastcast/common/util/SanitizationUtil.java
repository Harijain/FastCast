package com.fastcast.common.util;

import org.springframework.stereotype.Component;

@Component
public class SanitizationUtil {

    private static final String[] DANGEROUS_PATTERNS = {
            "<script", "</script>", "javascript:", "onerror=",
            "onload=", "onclick=", "<iframe", "</iframe>",
            "<img", "alert(", "document.cookie", "<svg"
    };

    public String sanitize(String input) {
        if (input == null) return null;
        String cleaned = input.trim();
        for (String pattern : DANGEROUS_PATTERNS) {
            cleaned = cleaned.replaceAll(
                    "(?i)" + java.util.regex.Pattern.quote(pattern), "");
        }
        // HTML encode remaining < > & " '
        cleaned = cleaned
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
        return cleaned;
    }

    public String sanitizeTitle(String title) {
        if (title == null) return null;
        String sanitized = sanitize(title);
        // Titles should be max 255 chars after sanitization
        return sanitized.length() > 255
                ? sanitized.substring(0, 255)
                : sanitized;
    }

    public String sanitizeDescription(String description) {
        if (description == null) return null;
        String sanitized = sanitize(description);
        return sanitized.length() > 1000
                ? sanitized.substring(0, 1000)
                : sanitized;
    }
}