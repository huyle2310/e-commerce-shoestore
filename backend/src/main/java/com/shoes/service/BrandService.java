package com.shoes.service;

import com.shoes.dto.BrandRequest;
import com.shoes.dto.BrandResponse;

import java.util.List;

public interface BrandService {
    List<BrandResponse> getAllBrands();
    BrandResponse getBrandById(Integer id);
    BrandResponse createBrand(BrandRequest request);
    BrandResponse updateBrand(Integer id, BrandRequest request);
    void deleteBrand(Integer id);
}
