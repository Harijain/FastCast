package com.fastcast.cache;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

@Slf4j
@Service
public class CacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final Counter cacheHitCounter;
    private final Counter cacheMissCounter;

    public CacheService(RedisTemplate<String, Object> redisTemplate,
                        MeterRegistry meterRegistry) {
        this.redisTemplate = redisTemplate;
        this.cacheHitCounter = Counter.builder("fastcast.cache.hits")
                .description("Number of cache hits")
                .register(meterRegistry);
        this.cacheMissCounter = Counter.builder("fastcast.cache.misses")
                .description("Number of cache misses")
                .register(meterRegistry);
    }

    public void set(String key, Object value, Duration ttl) {
        try {
            redisTemplate.opsForValue().set(key, value, ttl);
            log.debug("Cache SET: {}", key);
        } catch (Exception e) {
            log.warn("Cache SET failed for key: {} — {}", key, e.getMessage());
        }
    }

    public Optional<Object> get(String key) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value != null) {
                cacheHitCounter.increment();
                log.debug("Cache HIT: {}", key);
                return Optional.of(value);
            }
        } catch (Exception e) {
            log.warn("Cache GET failed for key: {} — {}", key, e.getMessage());
        }
        cacheMissCounter.increment();
        log.debug("Cache MISS: {}", key);
        return Optional.empty();
    }

    public void evict(String key) {
        try {
            redisTemplate.delete(key);
            log.debug("Cache EVICT: {}", key);
        } catch (Exception e) {
            log.warn("Cache EVICT failed for key: {} — {}", key, e.getMessage());
        }
    }

    public void evictPattern(String pattern) {
        try {
            var keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.debug("Cache EVICT pattern: {} ({} keys)", pattern, keys.size());
            }
        } catch (Exception e) {
            log.warn("Cache EVICT pattern failed: {} — {}", pattern, e.getMessage());
        }
    }
}