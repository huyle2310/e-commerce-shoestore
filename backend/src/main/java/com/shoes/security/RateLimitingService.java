package com.shoes.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class RateLimitingService {

    private static final int MAX_REQUESTS_PER_MINUTE = 100;
    private static final String RATE_LIMIT_PREFIX = "vanguard:rate_limit:";

    private final StringRedisTemplate stringRedisTemplate;
    private final Map<String, Bucket> localBucketCache = new ConcurrentHashMap<>();

    public RateLimitingService(@Autowired(required = false) StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RateLimitResult {
        private boolean allowed;
        private long remainingTokens;
        private long retryAfterSeconds;
    }

    public RateLimitResult tryConsume(String ip) {
        if (stringRedisTemplate != null) {
            try {
                String key = RATE_LIMIT_PREFIX + ip;
                Long currentCount = stringRedisTemplate.opsForValue().increment(key);
                if (currentCount != null && currentCount == 1L) {
                    stringRedisTemplate.expire(key, Duration.ofMinutes(1));
                }

                if (currentCount != null && currentCount <= MAX_REQUESTS_PER_MINUTE) {
                    long remaining = Math.max(0, MAX_REQUESTS_PER_MINUTE - currentCount);
                    return RateLimitResult.builder()
                            .allowed(true)
                            .remainingTokens(remaining)
                            .retryAfterSeconds(0)
                            .build();
                } else {
                    Long ttl = stringRedisTemplate.getExpire(key, TimeUnit.SECONDS);
                    long retryAfter = (ttl != null && ttl > 0) ? ttl : 60;
                    return RateLimitResult.builder()
                            .allowed(false)
                            .remainingTokens(0)
                            .retryAfterSeconds(retryAfter)
                            .build();
                }
            } catch (Exception e) {
                log.warn("Redis unavailable for rate limiting (ip: {}): {}. Falling back to in-memory Bucket4j.",
                        ip, e.getMessage());
            }
        }

        // Fallback to in-memory Bucket4j
        Bucket bucket = resolveBucket(ip);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            return RateLimitResult.builder()
                    .allowed(true)
                    .remainingTokens(probe.getRemainingTokens())
                    .retryAfterSeconds(0)
                    .build();
        } else {
            long waitForRefill = Math.max(1, probe.getNanosToWaitForRefill() / 1_000_000_000);
            return RateLimitResult.builder()
                    .allowed(false)
                    .remainingTokens(0)
                    .retryAfterSeconds(waitForRefill)
                    .build();
        }
    }

    public Bucket resolveBucket(String ip) {
        return localBucketCache.computeIfAbsent(ip, this::newBucket);
    }

    private Bucket newBucket(String ip) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(MAX_REQUESTS_PER_MINUTE)
                .refillGreedy(MAX_REQUESTS_PER_MINUTE, Duration.ofMinutes(1))
                .build();
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
