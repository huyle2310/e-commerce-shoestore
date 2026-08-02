package com.shoes.controller;

import com.shoes.dto.SiteSettingsRequest;
import com.shoes.dto.SiteSettingsResponse;
import com.shoes.service.SiteSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings/site")
@RequiredArgsConstructor
@CrossOrigin("*")
public class SiteSettingsController {

    private final SiteSettingsService siteSettingsService;

    // Public endpoint to get site settings
    @GetMapping
    public ResponseEntity<SiteSettingsResponse> getSettings() {
        return ResponseEntity.ok(siteSettingsService.getSettings());
    }

    // Admin endpoint to update site settings
    @PutMapping
    public ResponseEntity<SiteSettingsResponse> updateSettings(@RequestBody SiteSettingsRequest request) {
        return ResponseEntity.ok(siteSettingsService.updateSettings(request));
    }
}
