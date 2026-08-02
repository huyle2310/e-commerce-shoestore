package com.shoes.controller;

import com.shoes.dto.BannerRequest;
import com.shoes.dto.BannerResponse;
import com.shoes.service.BannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/banners")
@RequiredArgsConstructor
@CrossOrigin("*")
public class BannerController {

    private final BannerService bannerService;

    // Public endpoint for frontend
    @GetMapping
    public ResponseEntity<List<BannerResponse>> getActiveBanners() {
        return ResponseEntity.ok(bannerService.getActiveBanners());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BannerResponse> getBannerById(@PathVariable Integer id) {
        return ResponseEntity.ok(bannerService.getBannerById(id));
    }

    // --- ADMIN APIs ---
    
    @GetMapping("/admin/all")
    public ResponseEntity<List<BannerResponse>> getAllBanners() {
        return ResponseEntity.ok(bannerService.getAllBanners());
    }

    @PostMapping
    public ResponseEntity<BannerResponse> createBanner(@Valid @RequestBody BannerRequest request) {
        return ResponseEntity.ok(bannerService.createBanner(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BannerResponse> updateBanner(
            @PathVariable Integer id,
            @Valid @RequestBody BannerRequest request) {
        return ResponseEntity.ok(bannerService.updateBanner(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBanner(@PathVariable Integer id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.noContent().build();
    }
}
