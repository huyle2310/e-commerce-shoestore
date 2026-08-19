package com.shoes.controller;

import com.shoes.dto.CartResponse;
import com.shoes.service.CartService;
import com.shoes.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@CrossOrigin("*")
@org.springframework.security.access.prepost.PreAuthorize("hasRole('CUSTOMER')")
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartResponse> getCart(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(cartService.getCartByUserId(userDetails.getId()));
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> addToCart(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam UUID variantId,
            @RequestParam int quantity,
            @RequestParam(required = false) UUID inventoryBatchId) {
        return ResponseEntity.ok(cartService.addToCart(userDetails.getId(), variantId, quantity, inventoryBatchId));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> updateCartItemQuantity(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID itemId,
            @RequestParam int quantity) {
        return ResponseEntity.ok(cartService.updateItemQuantity(userDetails.getId(), itemId, quantity));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> removeCartItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID itemId) {
        return ResponseEntity.ok(cartService.removeCartItem(userDetails.getId(), itemId));
    }
}
