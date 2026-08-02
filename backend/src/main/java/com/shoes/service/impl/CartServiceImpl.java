package com.shoes.service.impl;

import com.shoes.dto.CartItemResponse;
import com.shoes.dto.CartResponse;
import com.shoes.entity.Cart;
import com.shoes.entity.CartItem;
import com.shoes.entity.ProductVariant;
import com.shoes.entity.User;
import com.shoes.repository.CartItemRepository;
import com.shoes.repository.CartRepository;
import com.shoes.repository.ProductVariantRepository;
import com.shoes.repository.UserRepository;
import com.shoes.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCartByUserId(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Cart cart = cartRepository.findByUser(user).orElseGet(() -> {
            Cart newCart = Cart.builder().user(user).items(new ArrayList<>()).build();
            return cartRepository.save(newCart);
        });
        return mapToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addToCart(UUID userId, UUID variantId, int quantity) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Cart cart = cartRepository.findByUser(user).orElseGet(() -> {
            Cart newCart = Cart.builder().user(user).items(new ArrayList<>()).build();
            return cartRepository.save(newCart);
        });

        ProductVariant variant = variantRepository.findById(variantId).orElseThrow(() -> new RuntimeException("Variant not found"));

        Optional<CartItem> existingItemOpt = cart.getItems().stream()
                .filter(item -> item.getVariant().getId().equals(variantId))
                .findFirst();

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            int newQuantity = existingItem.getQuantity() + quantity;
            if (newQuantity > variant.getStockQuantity()) {
                throw new RuntimeException("Số lượng mua vượt quá số lượng tồn kho");
            }
            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
        } else {
            if (quantity > variant.getStockQuantity()) {
                throw new RuntimeException("Số lượng mua vượt quá số lượng tồn kho");
            }
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .variant(variant)
                    .quantity(quantity)
                    .build();
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        return mapToCartResponse(cartRepository.save(cart));
    }

    @Override
    @Transactional
    public CartResponse updateItemQuantity(UUID userId, UUID cartItemId, int quantity) {
        CartItem item = cartItemRepository.findById(cartItemId).orElseThrow(() -> new RuntimeException("Cart Item not found"));
        
        if (!item.getCart().getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        if (quantity <= 0) {
            cartItemRepository.delete(item);
            item.getCart().getItems().remove(item);
        } else {
            if (quantity > item.getVariant().getStockQuantity()) {
                throw new RuntimeException("Số lượng mua vượt quá số lượng tồn kho");
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        return mapToCartResponse(cartRepository.findById(item.getCart().getId()).get());
    }

    @Override
    @Transactional
    public CartResponse removeCartItem(UUID userId, UUID cartItemId) {
        CartItem item = cartItemRepository.findById(cartItemId).orElseThrow(() -> new RuntimeException("Cart Item not found"));
        
        if (!item.getCart().getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        Cart cart = item.getCart();
        cart.getItems().remove(item);
        cartItemRepository.delete(item);
        return mapToCartResponse(cartRepository.save(cart));
    }

    @Override
    @Transactional
    public void clearCart(UUID cartId) {
        Cart cart = cartRepository.findById(cartId).orElseThrow(() -> new RuntimeException("Cart not found"));
        cartItemRepository.deleteAll(cart.getItems());
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    private CartResponse mapToCartResponse(Cart cart) {
        List<CartItemResponse> itemResponses = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        if (cart.getItems() != null) {
            for (CartItem item : cart.getItems()) {
                BigDecimal unitPrice = item.getVariant().getProduct().getBasePrice().add(item.getVariant().getPriceModifier() != null ? item.getVariant().getPriceModifier() : BigDecimal.ZERO);
                BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
                totalAmount = totalAmount.add(itemTotal);

                String imageUrl = "";
                if (item.getVariant().getProduct().getImages() != null && !item.getVariant().getProduct().getImages().isEmpty()) {
                    imageUrl = item.getVariant().getProduct().getImages().get(0).getImageUrl();
                }

                itemResponses.add(CartItemResponse.builder()
                        .id(item.getId())
                        .variantId(item.getVariant().getId())
                        .sku(item.getVariant().getSku())
                        .productName(item.getVariant().getProduct().getNameVi())
                        .color(item.getVariant().getColorVi())
                        .size(item.getVariant().getSize())
                        .imageUrl(imageUrl)
                        .unitPrice(unitPrice)
                        .quantity(item.getQuantity())
                        .stockQuantity(item.getVariant().getStockQuantity())
                        .totalPrice(itemTotal)
                        .build());
            }
        }

        return CartResponse.builder()
                .id(cart.getId())
                .items(itemResponses)
                .totalAmount(totalAmount)
                .build();
    }
}
