package com.shoes.service;

import com.shoes.dto.SiteSettingsRequest;
import com.shoes.dto.SiteSettingsResponse;

public interface SiteSettingsService {
    SiteSettingsResponse getSettings();
    SiteSettingsResponse updateSettings(SiteSettingsRequest request);
}
