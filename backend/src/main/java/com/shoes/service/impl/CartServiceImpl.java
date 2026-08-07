package com.shoes.service.impl;

import com.shoes.dto.CartItemResponse;
import com.shoes.dto.CartResponse;
import com.shoes.entity.Cart;
import com.shoes.entity.CartItem;
import com.shoes.entity.Product;
import com.shoes.entity.ProductStatus;
import com.shoes.entity.ProductVariant;
import com.shoes.entity.User;
import com.shoes.entity.Voucher;
import com.shoes.entity.InventoryBatch;
import com.shoes.entity.WarehouseType;
import com.shoes.repository.CartItemRepository;
import com.shoes.repository.CartRepository;
import com.shoes.repository.InventoryBatchRepository;
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
    private final InventoryBatchRepository batchRepository;

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
    public CartResponse addToCart(UUID userId, UUID variantId, int quantity, UUID inventoryBatchId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Cart cart = cartRepository.findByUser(user).orElseGet(() -> {
            Cart newCart = Cart.builder().user(user).items(new ArrayList<>()).build();
            return cartRepository.save(newCart);
        });

        ProductVariant variant = variantRepository.findById(variantId).orElseThrow(() -> new RuntimeException("Variant not found"));
        
        InventoryBatch batch = null;
        if (inventoryBatchId != null) {
            batch = batchRepository.findById(inventoryBatchId).orElseThrow(() -> new RuntimeException("Batch not found"));
            if (batch.getWarehouseType() != WarehouseType.CLEARANCE || batch.getProductStatus() != ProductStatus.ACTIVE) {
                throw new RuntimeException("Batch is not available for clearance sale");
            }
        } else {
            validateSellableVariant(variant, quantity);
        }

        Optional<CartItem> existingItemOpt = cart.getItems().stream()
                .filter(item -> item.getVariant().getId().equals(variantId) && 
                       (inventoryBatchId == null ? item.getInventoryBatchId() == null : inventoryBatchId.equals(item.getInventoryBatchId())))
                .findFirst();

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            int newQuantity = existingItem.getQuantity() + quantity;
            if (batch != null) {
                if (newQuantity > batch.getQuantity()) {
                    throw new RuntimeException("Not enough stock in clearance batch");
                }
            } else {
                validateSellableVariant(variant, newQuantity);
            }
            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
        } else {
            if (batch != null && quantity > batch.getQuantity()) {
                throw new RuntimeException("Not enough stock in clearance batch");
            }
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .variant(variant)
                    .quantity(quantity)
                    .inventoryBatchId(inventoryBatchId)
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
            if (item.getInventoryBatchId() != null) {
                InventoryBatch batch = batchRepository.findById(item.getInventoryBatchId()).orElseThrow(() -> new RuntimeException("Batch not found"));
                if (quantity > batch.getQuantity()) {
                    throw new RuntimeException("Not enough stock in clearance batch");
                }
            } else {
                validateSellableVariant(item.getVariant(), quantity);
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
                BigDecimal unitPrice;
                Integer stockQty;
                Integer quality = null;
                String note = null;
                UUID batchId = item.getInventoryBatchId();
                String imageUrl = "";
                
                if (batchId != null) {
                    InventoryBatch batch = batchRepository.findById(batchId).orElse(null);
                    if (batch != null) {
                        unitPrice = batch.getClearancePrice();
                        stockQty = batch.getQuantity();
                        quality = batch.getQualityPercentage();
                        note = batch.getConditionNote();
                        if (batch.getImageUrl() != null && !batch.getImageUrl().isEmpty()) {
                            imageUrl = batch.getImageUrl();
                        }
                    } else {
                        unitPrice = computeEffectivePrice(item.getVariant());
                        stockQty = 0;
                    }
                } else {
                    unitPrice = computeEffectivePrice(item.getVariant());
                    stockQty = item.getVariant().getStockQuantity();
                }

                if (imageUrl.isEmpty() && item.getVariant().getProduct().getImages() != null && !item.getVariant().getProduct().getImages().isEmpty()) {
                    imageUrl = item.getVariant().getProduct().getImages().get(0).getImageUrl();
                }

                BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
                totalAmount = totalAmount.add(itemTotal);

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
                        .stockQuantity(stockQty)
                        .totalPrice(itemTotal)
                        .inventoryBatchId(batchId)
                        .qualityPercentage(quality)
                        .conditionNote(note)
                        .build());
            }
        }

        return CartResponse.builder()
                .id(cart.getId())
                .items(itemResponses)
                .totalAmount(totalAmount)
                .build();
    }
    private void validateSellableVariant(ProductVariant variant, int quantity) {
        if (quantity <= 0) {
            throw new RuntimeException("Số lượng phải lớn hơn 0");
        }

        Product product = variant.getProduct();
        if (product == null || Boolean.FALSE.equals(product.getIsActive())) {
            throw new RuntimeException("Sản phẩm không còn kinh doanh");
        }
        if (variant.getStockQuantity() < quantity) {
            throw new RuntimeException("Số lượng mua vượt quá số lượng tồn kho");
        }
    }

    private BigDecimal computeEffectivePrice(ProductVariant variant) {
        // Lấy danh sách lô sẽ xuất kho đầu tiên
        List<InventoryBatch> activeBatches = batchRepository.findActiveBatchesForDeduction(variant.getId());
        if (activeBatches != null && !activeBatches.isEmpty()) {
            InventoryBatch firstBatch = activeBatches.get(0);
            if (firstBatch.getWarehouseType() == WarehouseType.CLEARANCE && firstBatch.getClearancePrice() != null) {
                return firstBatch.getClearancePrice();
            }
        }

        BigDecimal basePrice = variant.getProduct().getBasePrice() != null
                ? variant.getProduct().getBasePrice()
                : BigDecimal.ZERO;
        BigDecimal priceModifier = variant.getPriceModifier() != null
                ? variant.getPriceModifier()
                : BigDecimal.ZERO;
        return basePrice.add(priceModifier);
    }
}
