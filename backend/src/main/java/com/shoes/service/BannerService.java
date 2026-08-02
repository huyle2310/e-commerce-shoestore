package com.shoes.service;

import com.shoes.dto.BannerRequest;
import com.shoes.dto.BannerResponse;

import java.util.List;

public interface BannerService {
    List<BannerResponse> getAllBanners();
    List<BannerResponse> getActiveBanners();
    BannerResponse getBannerById(Integer id);
    BannerResponse createBanner(BannerRequest request);
    BannerResponse updateBanner(Integer id, BannerRequest request);
    void deleteBanner(Integer id);
}
