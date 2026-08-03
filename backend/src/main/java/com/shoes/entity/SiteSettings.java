package com.shoes.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "site_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteSettings {
    @Id
    private Integer id = 1; // Only one record will exist

    // --- HOME ---
    private String logoUrl;

    @Column(name = "home_short_desc_vi", columnDefinition = "TEXT")
    private String homeShortDescVi;

    @Column(name = "home_short_desc_en", columnDefinition = "TEXT")
    private String homeShortDescEn;

    @Column(name = "home_banners_json", columnDefinition = "TEXT")
    private String homeBannersJson;

    @Column(name = "banner_interval_ms")
    private Integer bannerIntervalMs;

    @Column(name = "home_featured_images_json", columnDefinition = "TEXT")
    private String homeFeaturedImagesJson;

    // --- ABOUT ---
    @Column(name = "about_title_vi")
    private String aboutTitleVi;

    @Column(name = "about_title_en")
    private String aboutTitleEn;

    @Column(name = "about_slogan_vi")
    private String aboutSloganVi;

    @Column(name = "about_slogan_en")
    private String aboutSloganEn;

    @Column(name = "about_content_vi", columnDefinition = "TEXT")
    private String aboutContentVi;

    @Column(name = "about_content_en", columnDefinition = "TEXT")
    private String aboutContentEn;

    // --- CONTACT ---
    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_address_vi")
    private String contactAddressVi;

    // --- POLICIES ---
    @Column(name = "shipping_policy_vi", columnDefinition = "TEXT")
    private String shippingPolicyVi;

    @Column(name = "shipping_policy_en", columnDefinition = "TEXT")
    private String shippingPolicyEn;

    @Column(name = "return_policy_vi", columnDefinition = "TEXT")
    private String returnPolicyVi;

    @Column(name = "return_policy_en", columnDefinition = "TEXT")
    private String returnPolicyEn;

    @Column(name = "contact_address_en")
    private String contactAddressEn;

    @Column(name = "social_links_json", columnDefinition = "TEXT")
    private String socialLinksJson;

    // --- DYNAMIC HOMEPAGE ---
    @Column(name = "home_hero_title_vi")
    private String homeHeroTitleVi;

    @Column(name = "home_hero_title_en")
    private String homeHeroTitleEn;

    @Column(name = "home_services_json", columnDefinition = "TEXT")
    private String homeServicesJson;

    @Column(name = "home_categories_title_vi")
    private String homeCategoriesTitleVi;

    @Column(name = "home_categories_title_en")
    private String homeCategoriesTitleEn;

    @Column(name = "home_categories_subtitle_vi")
    private String homeCategoriesSubtitleVi;

    @Column(name = "home_categories_subtitle_en")
    private String homeCategoriesSubtitleEn;

    @Column(name = "home_categories_json", columnDefinition = "TEXT")
    private String homeCategoriesJson;

    @Column(name = "home_featured_title_vi")
    private String homeFeaturedTitleVi;

    @Column(name = "home_featured_title_en")
    private String homeFeaturedTitleEn;

    @Column(name = "home_featured_subtitle_vi")
    private String homeFeaturedSubtitleVi;

    @Column(name = "home_featured_subtitle_en")
    private String homeFeaturedSubtitleEn;

    // --- DYNAMIC MENU ---
    @Column(name = "header_menu_json", columnDefinition = "TEXT")
    private String headerMenuJson;

    @Column(name = "footer_menu_json", columnDefinition = "TEXT")
    private String footerMenuJson;
}
