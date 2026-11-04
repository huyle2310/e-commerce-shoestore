package com.shoes.service.impl;

import com.shoes.dto.SiteSettingsRequest;
import com.shoes.dto.SiteSettingsResponse;
import com.shoes.entity.SiteSettings;
import com.shoes.repository.SiteSettingsRepository;
import com.shoes.service.SiteSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

@Service
@RequiredArgsConstructor
public class SiteSettingsServiceImpl implements SiteSettingsService {

    private final SiteSettingsRepository repository;

    @Override
    @Cacheable(value = "site_settings", key = "'current'")
    public SiteSettingsResponse getSettings() {
        SiteSettings settings = repository.findById(1).orElseGet(() -> {
            SiteSettings defaultSettings = new SiteSettings();
            defaultSettings.setId(1);
            return repository.save(defaultSettings);
        });
        return mapToResponse(settings);
    }

    @Override
    @CacheEvict(value = "site_settings", allEntries = true)
    public SiteSettingsResponse updateSettings(SiteSettingsRequest request) {
        SiteSettings settings = repository.findById(1).orElseGet(() -> {
            SiteSettings newSettings = new SiteSettings();
            newSettings.setId(1);
            return newSettings;
        });

        settings.setLogoUrl(request.getLogoUrl());
        settings.setHomeShortDescVi(request.getHomeShortDescVi());
        settings.setHomeShortDescEn(request.getHomeShortDescEn());
        settings.setHomeBannersJson(request.getHomeBannersJson());
        settings.setBannerIntervalMs(request.getBannerIntervalMs());
        settings.setHomeFeaturedImagesJson(request.getHomeFeaturedImagesJson());
        
        settings.setAboutTitleVi(request.getAboutTitleVi());
        settings.setAboutTitleEn(request.getAboutTitleEn());
        settings.setAboutSloganVi(request.getAboutSloganVi());
        settings.setAboutSloganEn(request.getAboutSloganEn());
        settings.setAboutContentVi(request.getAboutContentVi());
        settings.setAboutContentEn(request.getAboutContentEn());
        
        settings.setContactPhone(request.getContactPhone());
        settings.setContactEmail(request.getContactEmail());
        settings.setContactAddressVi(request.getContactAddressVi());
        settings.setContactAddressEn(request.getContactAddressEn());
        settings.setShippingPolicyVi(request.getShippingPolicyVi());
        settings.setShippingPolicyEn(request.getShippingPolicyEn());
        settings.setReturnPolicyVi(request.getReturnPolicyVi());
        settings.setReturnPolicyEn(request.getReturnPolicyEn());
        settings.setSocialLinksJson(request.getSocialLinksJson());

        // --- DYNAMIC HOMEPAGE ---
        settings.setHomeHeroTitleVi(request.getHomeHeroTitleVi());
        settings.setHomeHeroTitleEn(request.getHomeHeroTitleEn());
        settings.setHomeServicesJson(request.getHomeServicesJson());
        settings.setHomeCategoriesTitleVi(request.getHomeCategoriesTitleVi());
        settings.setHomeCategoriesTitleEn(request.getHomeCategoriesTitleEn());
        settings.setHomeCategoriesSubtitleVi(request.getHomeCategoriesSubtitleVi());
        settings.setHomeCategoriesSubtitleEn(request.getHomeCategoriesSubtitleEn());
        settings.setHomeCategoriesJson(request.getHomeCategoriesJson());
        settings.setHomeFeaturedTitleVi(request.getHomeFeaturedTitleVi());
        settings.setHomeFeaturedTitleEn(request.getHomeFeaturedTitleEn());
        settings.setHomeFeaturedSubtitleVi(request.getHomeFeaturedSubtitleVi());
        settings.setHomeFeaturedSubtitleEn(request.getHomeFeaturedSubtitleEn());

        // --- DYNAMIC MENU ---
        settings.setHeaderMenuJson(request.getHeaderMenuJson());
        settings.setFooterMenuJson(request.getFooterMenuJson());

        return mapToResponse(repository.save(settings));
    }

    private SiteSettingsResponse mapToResponse(SiteSettings settings) {
        return SiteSettingsResponse.builder()
                .logoUrl(settings.getLogoUrl())
                .homeShortDescVi(settings.getHomeShortDescVi())
                .homeShortDescEn(settings.getHomeShortDescEn())
                .homeBannersJson(settings.getHomeBannersJson())
                .bannerIntervalMs(settings.getBannerIntervalMs())
                .homeFeaturedImagesJson(settings.getHomeFeaturedImagesJson())
                .aboutTitleVi(settings.getAboutTitleVi())
                .aboutTitleEn(settings.getAboutTitleEn())
                .aboutSloganVi(settings.getAboutSloganVi())
                .aboutSloganEn(settings.getAboutSloganEn())
                .aboutContentVi(settings.getAboutContentVi())
                .aboutContentEn(settings.getAboutContentEn())
                .contactPhone(settings.getContactPhone())
                .contactEmail(settings.getContactEmail())
                .contactAddressVi(settings.getContactAddressVi())
                .contactAddressEn(settings.getContactAddressEn())
                .shippingPolicyVi(settings.getShippingPolicyVi())
                .shippingPolicyEn(settings.getShippingPolicyEn())
                .returnPolicyVi(settings.getReturnPolicyVi())
                .returnPolicyEn(settings.getReturnPolicyEn())
                .socialLinksJson(settings.getSocialLinksJson())
                .homeHeroTitleVi(settings.getHomeHeroTitleVi())
                .homeHeroTitleEn(settings.getHomeHeroTitleEn())
                .homeServicesJson(settings.getHomeServicesJson())
                .homeCategoriesTitleVi(settings.getHomeCategoriesTitleVi())
                .homeCategoriesTitleEn(settings.getHomeCategoriesTitleEn())
                .homeCategoriesSubtitleVi(settings.getHomeCategoriesSubtitleVi())
                .homeCategoriesSubtitleEn(settings.getHomeCategoriesSubtitleEn())
                .homeCategoriesJson(settings.getHomeCategoriesJson())
                .homeFeaturedTitleVi(settings.getHomeFeaturedTitleVi())
                .homeFeaturedTitleEn(settings.getHomeFeaturedTitleEn())
                .homeFeaturedSubtitleVi(settings.getHomeFeaturedSubtitleVi())
                .homeFeaturedSubtitleEn(settings.getHomeFeaturedSubtitleEn())
                .headerMenuJson(settings.getHeaderMenuJson())
                .footerMenuJson(settings.getFooterMenuJson())
                .build();
    }
}
