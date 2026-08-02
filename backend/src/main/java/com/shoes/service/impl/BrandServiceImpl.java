package com.shoes.service.impl;

import com.shoes.dto.BrandRequest;
import com.shoes.dto.BrandResponse;
import com.shoes.entity.Brand;
import com.shoes.repository.BrandRepository;
import com.shoes.service.BrandService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;

    @Override
    public List<BrandResponse> getAllBrands() {
        return brandRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BrandResponse getBrandById(Integer id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        return mapToResponse(brand);
    }

    @Override
    public BrandResponse createBrand(BrandRequest request) {
        Brand brand = Brand.builder()
                .name(request.getName())
                .logoUrl(request.getLogoUrl())
                .build();
        return mapToResponse(brandRepository.save(brand));
    }

    @Override
    public BrandResponse updateBrand(Integer id, BrandRequest request) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        brand.setName(request.getName());
        brand.setLogoUrl(request.getLogoUrl());
        return mapToResponse(brandRepository.save(brand));
    }

    @Override
    public void deleteBrand(Integer id) {
        brandRepository.deleteById(id);
    }

    private BrandResponse mapToResponse(Brand brand) {
        return BrandResponse.builder()
                .id(brand.getId())
                .name(brand.getName())
                .logoUrl(brand.getLogoUrl())
                .build();
    }
}
