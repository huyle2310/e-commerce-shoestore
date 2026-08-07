package com.shoes.service;

import com.shoes.dto.CartResponse;
import java.util.UUID;

public interface CartService {
    CartResponse getCartByUserId(UUID userId);
    CartResponse addToCart(UUID userId, UUID variantId, int quantity, UUID inventoryBatchId);
    CartResponse updateItemQuantity(UUID userId, UUID cartItemId, int quantity);
    CartResponse removeCartItem(UUID userId, UUID cartItemId);
    void clearCart(UUID cartId);
}
