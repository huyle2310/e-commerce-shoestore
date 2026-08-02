package com.shoes.service.impl;

import com.shoes.dto.BannerRequest;
import com.shoes.dto.BannerResponse;
import com.shoes.entity.Banner;
import com.shoes.repository.BannerRepository;
import com.shoes.service.BannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BannerServiceImpl implements BannerService {

    private final BannerRepository bannerRepository;

    @Override
    public List<BannerResponse> getAllBanners() {
        return bannerRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BannerResponse> getActiveBanners() {
        return bannerRepository.findByIsActiveTrueOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BannerResponse getBannerById(Integer id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found"));
        return mapToResponse(banner);
    }

    @Override
    public BannerResponse createBanner(BannerRequest request) {
        Banner banner = Banner.builder()
                .titleVi(request.getTitleVi())
                .titleEn(request.getTitleEn())
                .imageUrl(request.getImageUrl())
                .targetUrl(request.getTargetUrl())
                .position(request.getPosition())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
                
        return mapToResponse(bannerRepository.save(banner));
    }

    @Override
    public BannerResponse updateBanner(Integer id, BannerRequest request) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found"));
                
        banner.setTitleVi(request.getTitleVi());
        banner.setTitleEn(request.getTitleEn());
        banner.setImageUrl(request.getImageUrl());
        banner.setTargetUrl(request.getTargetUrl());
        banner.setPosition(request.getPosition());
        if (request.getIsActive() != null) {
            banner.setIsActive(request.getIsActive());
        }
        
        return mapToResponse(bannerRepository.save(banner));
    }

    @Override
    public void deleteBanner(Integer id) {
        bannerRepository.deleteById(id);
    }

    private BannerResponse mapToResponse(Banner banner) {
        return BannerResponse.builder()
                .id(banner.getId())
                .titleVi(banner.getTitleVi())
                .titleEn(banner.getTitleEn())
                .imageUrl(banner.getImageUrl())
                .targetUrl(banner.getTargetUrl())
                .position(banner.getPosition())
                .isActive(banner.getIsActive())
                .createdAt(banner.getCreatedAt())
                .build();
    }
}
