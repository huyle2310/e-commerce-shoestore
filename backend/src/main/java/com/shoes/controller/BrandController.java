package com.shoes.controller;

import com.shoes.dto.BrandRequest;
import com.shoes.dto.BrandResponse;
import com.shoes.service.BrandService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/brands")
@RequiredArgsConstructor
@CrossOrigin("*")
public class BrandController {

    private final BrandService brandService;

    @GetMapping
    public ResponseEntity<List<BrandResponse>> getAllBrands() {
        return ResponseEntity.ok(brandService.getAllBrands());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF', 'SALES_STAFF')")
    @PostMapping("/admin")
    public ResponseEntity<BrandResponse> createBrand(@RequestBody BrandRequest request) {
        return ResponseEntity.ok(brandService.createBrand(request));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF', 'SALES_STAFF')")
    @PutMapping("/admin/{id}")
    public ResponseEntity<BrandResponse> updateBrand(@PathVariable Integer id, @RequestBody BrandRequest request) {
        return ResponseEntity.ok(brandService.updateBrand(id, request));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF', 'SALES_STAFF')")
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteBrand(@PathVariable Integer id) {
        brandService.deleteBrand(id);
        return ResponseEntity.ok().build();
    }
}
