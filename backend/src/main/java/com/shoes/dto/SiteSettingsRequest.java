package com.shoes.dto;

import lombok.Data;

@Data
public class SiteSettingsRequest {
    private String logoUrl;
    
    private String homeShortDescVi;
    private String homeShortDescEn;
    private String homeBannersJson;
    private String homeFeaturedImagesJson;
    
    private String aboutTitleVi;
    private String aboutTitleEn;
    private String aboutSloganVi;
    private String aboutSloganEn;
    private String aboutContentVi;
    private String aboutContentEn;
    
    private String contactPhone;
    private String contactEmail;
    private String contactAddressVi;
    private String contactAddressEn;
    private String socialLinksJson;

    // --- DYNAMIC HOMEPAGE ---
    private String homeHeroTitleVi;
    private String homeHeroTitleEn;
    private String homeServicesJson;
    private String homeCategoriesTitleVi;
    private String homeCategoriesTitleEn;
    private String homeCategoriesSubtitleVi;
    private String homeCategoriesSubtitleEn;
    private String homeCategoriesJson;
    private String homeFeaturedTitleVi;
    private String homeFeaturedTitleEn;
    private String homeFeaturedSubtitleVi;
    private String homeFeaturedSubtitleEn;

    // --- DYNAMIC MENU ---
    private String headerMenuJson;
    private String footerMenuJson;
}
