package com.shoes.service.impl;

import com.shoes.dto.GuestOrderItemRequest;
import com.shoes.dto.OrderItemResponse;
import com.shoes.dto.OrderRequest;
import com.shoes.dto.OrderResponse;
import com.shoes.entity.*;
import com.shoes.repository.*;
import com.shoes.service.CartService;
import com.shoes.service.EmailService;
import com.shoes.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;
    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final InventoryBatchRepository batchRepository;
    private final CartService cartService;
    private final EmailService emailService;

    // ================================================================
    // Tính phí vận chuyển – backend tự tính, không tin frontend
    // ================================================================
    private BigDecimal calculateShippingFee(String province, String shippingAddress) {
        String target = (province != null ? province : "")
                + " " + (shippingAddress != null ? shippingAddress : "");
        target = target.toLowerCase().trim();

        if (target.contains("hồ chí minh") || target.contains("ho chi minh")
                || target.contains("hcm") || target.contains("tp.hcm")
                || target.contains("tp hcm")) {
            return BigDecimal.valueOf(20_000);
        }
        return BigDecimal.valueOf(40_000);
    }

    // ================================================================
    // Validation chung cho một item trước khi thêm vào đơn
    // ================================================================
    private void validateVariant(ProductVariant variant, int quantity) {
        if (quantity <= 0) {
            throw new RuntimeException("Số lượng phải lớn hơn 0: " + variant.getSku());
        }

        Product product = variant.getProduct();
        if (product == null || Boolean.FALSE.equals(product.getIsActive())) {
            throw new RuntimeException("Sản phẩm không còn kinh doanh: "
                    + (product != null ? product.getNameVi() : variant.getSku()));
        }

        if (variant.getStockQuantity() < quantity) {
            throw new RuntimeException("Sản phẩm " + product.getNameVi()
                    + " (Size " + variant.getSize() + ") không đủ tồn kho. "
                    + "Còn: " + variant.getStockQuantity() + ", yêu cầu: " + quantity);
        }
    }

    // ================================================================
    // Áp dụng voucher
    // ================================================================
    private BigDecimal applyVoucher(String voucherCode, UUID userId, BigDecimal totalAmount, Order order) {
        if (voucherCode == null || voucherCode.isBlank()) return BigDecimal.ZERO;

        Voucher voucher = voucherRepository.findByCode(voucherCode)
                .orElseThrow(() -> new RuntimeException("Mã giảm giá không tồn tại: " + voucherCode));

        if (!Boolean.TRUE.equals(voucher.getIsActive())) {
            throw new RuntimeException("Mã giảm giá đã hết hiệu lực");
        }
        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new RuntimeException("Mã giảm giá đã hết lượt sử dụng");
        }
        if (totalAmount.compareTo(voucher.getMinOrderValue()) < 0) {
            throw new RuntimeException("Đơn hàng chưa đạt giá trị tối thiểu để dùng mã giảm giá ("
                    + voucher.getMinOrderValue().toPlainString() + "đ)");
        }

        BigDecimal discount;
        if ("PERCENTAGE".equals(voucher.getDiscountType())) {
            discount = totalAmount.multiply(voucher.getDiscountValue().divide(BigDecimal.valueOf(100)));
            if (voucher.getMaxDiscountAmount() != null
                    && discount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                discount = voucher.getMaxDiscountAmount();
            }
        } else {
            discount = voucher.getDiscountValue();
        }

        order.setVoucher(voucher);
        voucher.setUsedCount(voucher.getUsedCount() + 1);
        voucherRepository.save(voucher);

        if (userId != null) {
            Optional<UserVoucher> uvOpt = userVoucherRepository
                    .findById(new UserVoucherId(userId, voucher.getId()));
            if (uvOpt.isPresent()) {
                UserVoucher uv = uvOpt.get();
                uv.setUsageCount(uv.getUsageCount() + 1);
                userVoucherRepository.save(uv);
            }
        }

        return discount;
    }

    // ================================================================
    // Build OrderItem từ variant + qty và DEDUCT STOCK từ Batch
    // ================================================================
    private List<OrderItem> buildOrderItems(Order order, ProductVariant variant, int requiredQuantity, UUID inventoryBatchId) {
        // Tìm các lô được ưu tiên xuất kho (Clearance -> Quality ASC -> Import Date ASC)
        List<InventoryBatch> activeBatches;
        if (inventoryBatchId != null) {
            InventoryBatch specificBatch = batchRepository.findById(inventoryBatchId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lô hàng thanh lý"));
            activeBatches = List.of(specificBatch);
        } else {
            activeBatches = batchRepository.findActiveBatchesForDeduction(variant.getId());
        }
        List<OrderItem> resultItems = new ArrayList<>();
        
        int remainingQty = requiredQuantity;

        // Trừ tồn kho theo thứ tự ưu tiên
        for (InventoryBatch batch : activeBatches) {
            if (remainingQty <= 0) break;
            
            BigDecimal effectivePrice;
            if (batch.getWarehouseType() == WarehouseType.CLEARANCE && batch.getClearancePrice() != null) {
                effectivePrice = batch.getClearancePrice();
            } else {
                BigDecimal base = variant.getProduct().getBasePrice() != null ? variant.getProduct().getBasePrice() : BigDecimal.ZERO;
                BigDecimal mod  = variant.getPriceModifier() != null ? variant.getPriceModifier() : BigDecimal.ZERO;
                effectivePrice = base.add(mod);
            }

            int deductQty = Math.min(batch.getQuantity(), remainingQty);
            batch.setQuantity(batch.getQuantity() - deductQty);
            batchRepository.save(batch);
            
            BigDecimal itemTotal = effectivePrice.multiply(BigDecimal.valueOf(deductQty));
            
            resultItems.add(OrderItem.builder()
                    .order(order)
                    .variant(variant)
                    .quantity(deductQty)
                    .unitPrice(effectivePrice)
                    .totalPrice(itemTotal)
                    .inventoryBatchId(batch.getId())
                    .build());

            remainingQty -= deductQty;
        }

        if (remainingQty > 0) {
            throw new RuntimeException("Kho không đủ số lượng để xuất " + variant.getSku());
        }

        // Cập nhật derived field
        Integer totalActiveStock = batchRepository.sumActiveStockByVariantId(variant.getId());
        variant.setStockQuantity(totalActiveStock != null ? totalActiveStock : 0);
        variantRepository.save(variant);

        return resultItems;
    }

    // ================================================================
    // Finalize order amounts
    // ================================================================
    private void finalizeOrder(Order order, BigDecimal itemsTotal,
                               BigDecimal shippingFee, BigDecimal discountAmount) {
        if (discountAmount.compareTo(BigDecimal.ZERO) < 0) discountAmount = BigDecimal.ZERO;
        if (discountAmount.compareTo(itemsTotal) > 0)      discountAmount = itemsTotal;

        BigDecimal finalAmount = itemsTotal.add(shippingFee).subtract(discountAmount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) finalAmount = BigDecimal.ZERO;

        order.setTotalAmount(itemsTotal);
        order.setShippingFee(shippingFee);
        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(finalAmount);
    }

    // ================================================================
    // Đặt hàng cho user đã đăng nhập
    // ================================================================
    @Override
    @Transactional
    @Retryable(
        value = ObjectOptimisticLockingFailureException.class, 
        maxAttempts = 3, 
        backoff = @Backoff(delay = 500)
    )
    public OrderResponse placeOrder(UUID userId, OrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = Order.builder()
                .user(user)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .shippingAddress(request.getShippingAddress())
                .orderNote(request.getOrderNote())
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus("UNPAID")
                .orderStatus("PENDING")
                .email(user.getEmail())
                .items(new ArrayList<>())
                .build();

        BigDecimal itemsTotal = BigDecimal.ZERO;
        boolean isBuyNow = request.getItems() != null && !request.getItems().isEmpty();
        Cart cart = null;

        if (isBuyNow) {
            for (GuestOrderItemRequest reqItem : request.getItems()) {
                ProductVariant variant = variantRepository.findById(reqItem.getVariantId())
                        .orElseThrow(() -> new RuntimeException("Variant không tồn tại: " + reqItem.getVariantId()));
                validateVariant(variant, reqItem.getQuantity());
                List<OrderItem> builtItems = buildOrderItems(order, variant, reqItem.getQuantity(), reqItem.getInventoryBatchId());
                order.getItems().addAll(builtItems);
                for (OrderItem item : builtItems) {
                    itemsTotal = itemsTotal.add(item.getTotalPrice());
                }
            }
        } else {
            cart = cartRepository.findByUser(user)
                    .orElseThrow(() -> new RuntimeException("Giỏ hàng không tồn tại"));
            if (cart.getItems() == null || cart.getItems().isEmpty()) {
                throw new RuntimeException("Giỏ hàng trống");
            }
            for (CartItem cartItem : cart.getItems()) {
                ProductVariant variant = cartItem.getVariant();
                validateVariant(variant, cartItem.getQuantity());
                List<OrderItem> builtItems = buildOrderItems(order, variant, cartItem.getQuantity(), cartItem.getInventoryBatchId());
                order.getItems().addAll(builtItems);
                for (OrderItem item : builtItems) {
                    itemsTotal = itemsTotal.add(item.getTotalPrice());
                }
            }
        }

        BigDecimal shippingFee = calculateShippingFee(request.getProvince(), request.getShippingAddress());
        BigDecimal discountAmount = applyVoucher(request.getVoucherCode(), userId, itemsTotal, order);
        finalizeOrder(order, itemsTotal, shippingFee, discountAmount);

        Order savedOrder = orderRepository.save(order);

        if (!isBuyNow && cart != null) {
            cartService.clearCart(cart.getId());
        }

        if (!"SEPAY".equalsIgnoreCase(savedOrder.getPaymentMethod())) {
            emailService.sendOrderConfirmation(user.getEmail(), savedOrder);
        }

        return mapToOrderResponse(savedOrder);
    }

    // ================================================================
    // Đặt hàng cho guest
    // ================================================================
    @Override
    @Transactional
    @Retryable(
        value = ObjectOptimisticLockingFailureException.class, 
        maxAttempts = 3, 
        backoff = @Backoff(delay = 500)
    )
    public OrderResponse placeGuestOrder(OrderRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Giỏ hàng trống");
        }

        Order order = Order.builder()
                .user(null)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .shippingAddress(request.getShippingAddress())
                .orderNote(request.getOrderNote())
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus("UNPAID")
                .orderStatus("PENDING")
                .email(request.getEmail())
                .items(new ArrayList<>())
                .build();

        BigDecimal itemsTotal = BigDecimal.ZERO;

        for (GuestOrderItemRequest guestItem : request.getItems()) {
            ProductVariant variant = variantRepository.findById(guestItem.getVariantId())
                    .orElseThrow(() -> new RuntimeException("Variant không tồn tại: " + guestItem.getVariantId()));
            validateVariant(variant, guestItem.getQuantity());
            List<OrderItem> builtItems = buildOrderItems(order, variant, guestItem.getQuantity(), guestItem.getInventoryBatchId());
            order.getItems().addAll(builtItems);
            for (OrderItem item : builtItems) {
                itemsTotal = itemsTotal.add(item.getTotalPrice());
            }
        }

        BigDecimal shippingFee = calculateShippingFee(request.getProvince(), request.getShippingAddress());
        finalizeOrder(order, itemsTotal, shippingFee, BigDecimal.ZERO);

        Order savedOrder = orderRepository.save(order);

        if (request.getEmail() != null && !request.getEmail().isBlank()
                && !"SEPAY".equalsIgnoreCase(savedOrder.getPaymentMethod())) {
            emailService.sendOrderConfirmation(request.getEmail(), savedOrder);
        }

        return mapToOrderResponse(savedOrder);
    }

    @Override
    public OrderResponse getOrderById(UUID userId, UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        return mapToOrderResponse(order);
    }

    @Override
    public List<OrderResponse> getUserOrders(UUID userId) {
        if (userId == null) {
            return orderRepository.findAll().stream()
                    .map(this::mapToOrderResponse)
                    .collect(Collectors.toList());
        }
        return orderRepository.findByUserId(userId).stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(UUID orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        String oldStatus = order.getOrderStatus();

        order.setOrderStatus(status);
        if ("DELIVERED".equals(status)) {
            order.setPaymentStatus("PAID");

            if (order.getUser() != null) {
                User user = order.getUser();
                if (user.getTotalSpent() == null) user.setTotalSpent(BigDecimal.ZERO);
                user.setTotalSpent(user.getTotalSpent().add(order.getFinalAmount()));

                BigDecimal total = user.getTotalSpent();
                if (total.compareTo(new BigDecimal("10000000")) >= 0)       user.setRankName("TINH ANH");
                else if (total.compareTo(new BigDecimal("5000000")) >= 0)   user.setRankName("KIM CƯƠNG");
                else if (total.compareTo(new BigDecimal("2000000")) >= 0)   user.setRankName("VÀNG");
                else                                                         user.setRankName("MEMBER");
                userRepository.save(user);
            }
        } else if ("CANCELLED".equals(status) && !"CANCELLED".equals(oldStatus)) {
            restoreStockForCancelledOrder(order);
            String toEmail = order.getEmail();
            if (toEmail == null && order.getUser() != null) toEmail = order.getUser().getEmail();
            if (toEmail != null) {
                emailService.sendOrderCancellationEmail(toEmail, order, "Đơn hàng bị hủy bởi Quản trị viên");
            }
        }
        return mapToOrderResponse(orderRepository.save(order));
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(UUID userId, UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        if (!"PENDING".equals(order.getOrderStatus())) {
            throw new RuntimeException("Không thể hủy đơn hàng đang được xử lý hoặc giao hàng");
        }

        order.setOrderStatus("CANCELLED");
        restoreStockForCancelledOrder(order);
        
        String toEmail = order.getEmail();
        if (toEmail == null && order.getUser() != null) toEmail = order.getUser().getEmail();
        if (toEmail != null) {
            emailService.sendOrderCancellationEmail(toEmail, order, "Khách hàng tự hủy đơn");
        }
        
        return mapToOrderResponse(orderRepository.save(order));
    }

    private void restoreStockForCancelledOrder(Order order) {
        for (OrderItem item : order.getItems()) {
            ProductVariant variant = item.getVariant();
            if (variant != null) {
                if (item.getInventoryBatchId() != null) {
                    batchRepository.findById(item.getInventoryBatchId()).ifPresent(batch -> {
                        batch.setQuantity(batch.getQuantity() + item.getQuantity());
                        batchRepository.save(batch);
                    });
                } else {
                    // Lấy lô INVENTORY ACTIVE mới nhất
                    List<InventoryBatch> invBatches = batchRepository.findByVariantIdAndWarehouseTypeAndProductStatusOrderByImportDateAsc(
                            variant.getId(), WarehouseType.INVENTORY, ProductStatus.ACTIVE);
                    
                    if (invBatches != null && !invBatches.isEmpty()) {
                        InventoryBatch latestBatch = invBatches.get(invBatches.size() - 1);
                        latestBatch.setQuantity(latestBatch.getQuantity() + item.getQuantity());
                        batchRepository.save(latestBatch);
                    } else {
                        // Nếu không có, tạo lô trả về
                        InventoryBatch returnBatch = InventoryBatch.builder()
                                .batchCode("RETURN-" + System.currentTimeMillis() % 1000000)
                                .variant(variant)
                                .quantity(item.getQuantity())
                                .warehouseType(WarehouseType.INVENTORY)
                                .productStatus(ProductStatus.ACTIVE)
                                .qualityPercentage(100)
                                .importDate(LocalDateTime.now())
                                .conditionNote("Lô tạo tự động từ đơn hàng hủy")
                                .build();
                        batchRepository.save(returnBatch);
                    }
                }

                Integer totalActiveStock = batchRepository.sumActiveStockByVariantId(variant.getId());
                variant.setStockQuantity(totalActiveStock != null ? totalActiveStock : 0);
                variantRepository.save(variant);
            }
        }
    }

    // ================================================================
    // Map to Response
    // ================================================================
    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream().map(item -> {
            String productName = "Sản phẩm không còn tồn tại";
            String color = "", size = "", imageUrl = "", slug = "";

            try {
                if (item.getVariant() != null) {
                    ProductVariant v = item.getVariant();
                    color = v.getColorVi();
                    size  = v.getSize();

                    if (v.getProduct() != null) {
                        productName = v.getProduct().getNameVi();
                        slug = v.getProduct().getSlug();
                        if (v.getProduct().getImages() != null && !v.getProduct().getImages().isEmpty()) {
                            imageUrl = v.getProduct().getImages().get(0).getImageUrl();
                        }
                    }
                }

                if (item.getInventoryBatchId() != null) {
                    InventoryBatch batch = batchRepository.findById(item.getInventoryBatchId()).orElse(null);
                    if (batch != null && batch.getImageUrl() != null && !batch.getImageUrl().isEmpty()) {
                        imageUrl = batch.getImageUrl();
                    }
                }
            } catch (Exception ignored) {
            }

            Integer quality = null;
            String note = null;
            if (item.getInventoryBatchId() != null) {
                InventoryBatch batch = batchRepository.findById(item.getInventoryBatchId()).orElse(null);
                if (batch != null) {
                    quality = batch.getQualityPercentage();
                    note = batch.getConditionNote();
                }
            }

            return OrderItemResponse.builder()
                    .id(item.getId())
                    .productName(productName)
                    .color(color)
                    .size(size)
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .totalPrice(item.getTotalPrice())
                    .imageUrl(imageUrl)
                    .slug(slug)
                    .inventoryBatchId(item.getInventoryBatchId())
                    .qualityPercentage(quality)
                    .conditionNote(note)
                    .build();
        }).collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .fullName(order.getFullName())
                .phone(order.getPhone())
                .shippingAddress(order.getShippingAddress())
                .orderNote(order.getOrderNote())
                .totalAmount(order.getTotalAmount())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .orderStatus(order.getOrderStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(items)
                .build();
    }
}
