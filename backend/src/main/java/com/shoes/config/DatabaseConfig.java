package com.shoes.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.annotation.PostConstruct;

@Configuration
public class DatabaseConfig {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseConfig(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void init() {
        try {
            jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
            System.out.println("pg_trgm extension checked/enabled successfully.");
        } catch (Exception e) {
            System.err.println("Failed to create pg_trgm extension. Error: " + e.getMessage());
        }
    }
}
