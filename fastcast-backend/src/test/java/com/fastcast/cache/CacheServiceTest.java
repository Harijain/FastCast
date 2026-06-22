package com.fastcast.cache;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
@DisplayName("CacheService unit tests")
class CacheServiceTest {

    @Mock private RedisTemplate<String, Object> redisTemplate;
    @Mock private ValueOperations<String, Object> valueOps;

    private CacheService cacheService;
    private MeterRegistry meterRegistry;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOps);
        cacheService = new CacheService(redisTemplate, meterRegistry);
    }

    @Test
    @DisplayName("get — returns value and increments hit counter on cache hit")
    void get_existingKey_returnsValueAndIncrementsHitCounter() {
        when(valueOps.get("video:123")).thenReturn("cached-value");

        Optional<Object> result = cacheService.get("video:123");

        assertThat(result).isPresent().contains("cached-value");
        assertThat(meterRegistry.counter("fastcast.cache.hits").count()).isEqualTo(1.0);
        assertThat(meterRegistry.counter("fastcast.cache.misses").count()).isEqualTo(0.0);
    }

    @Test
    @DisplayName("get — returns empty and increments miss counter on cache miss")
    void get_missingKey_returnsEmptyAndIncrementsMissCounter() {
        when(valueOps.get("video:999")).thenReturn(null);

        Optional<Object> result = cacheService.get("video:999");

        assertThat(result).isEmpty();
        assertThat(meterRegistry.counter("fastcast.cache.misses").count()).isEqualTo(1.0);
        assertThat(meterRegistry.counter("fastcast.cache.hits").count()).isEqualTo(0.0);
    }

    @Test
    @DisplayName("set — calls Redis with correct key, value and TTL")
    void set_validKeyValue_callsRedisWithTtl() {
        cacheService.set("video:123", "value", Duration.ofHours(1));
        verify(valueOps).set("video:123", "value", Duration.ofHours(1));
    }

    @Test
    @DisplayName("evict — deletes key from Redis")
    void evict_existingKey_deletesFromRedis() {
        cacheService.evict("video:123");
        verify(redisTemplate).delete("video:123");
    }

    @Test
    @DisplayName("get — returns empty and does not throw when Redis is down")
    void get_redisDown_returnsEmptyGracefully() {
        when(valueOps.get(anyString()))
                .thenThrow(new RuntimeException("Redis connection refused"));

        Optional<Object> result = cacheService.get("video:123");

        // Must not throw — graceful degradation
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("set — silently absorbs Redis failure without throwing")
    void set_redisDown_doesNotThrow() {
        doThrow(new RuntimeException("Redis down"))
                .when(valueOps).set(any(), any(), any(Duration.class));

        assertThatNoException().isThrownBy(() ->
                cacheService.set("video:123", "value", Duration.ofMinutes(5)));
    }
}