package com.shoes.service.impl;

import com.shoes.dto.OrderItemResponse;
import com.shoes.dto.OrderRequest;
import com.shoes.dto.GuestOrderItemRequest;
import com.shoes.dto.OrderResponse;
import com.shoes.entity.*;
import com.shoes.repository.*;
import com.shoes.service.CartService;
import com.shoes.service.EmailService;
import com.shoes.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;
    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final CartService cartService;
    private final EmailService emailService;

    @Override
    @Transactional
    public OrderResponse placeOrder(UUID userId, OrderRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();
        Order order = Order.builder()
                .user(user)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .shippingAddress(request.getShippingAddress())
                .orderNote(request.getOrderNote())
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus("UNPAID")
                .orderStatus("PENDING")
                .items(new ArrayList<>())
                .build();

        boolean isBuyNow = request.getItems() != null && !request.getItems().isEmpty();
        Cart cart = null;

        if (isBuyNow) {
            for (GuestOrderItemRequest reqItem : request.getItems()) {
                ProductVariant variant = variantRepository.findById(reqItem.getVariantId())
                        .orElseThrow(() -> new RuntimeException("Variant not found"));
                if (variant.getStockQuantity() < reqItem.getQuantity()) {
                    throw new RuntimeException("Sản phẩm " + variant.getProduct().getNameVi() + " (Size "
                            + variant.getSize() + ") không đủ tồn kho!");
                }
                variant.setStockQuantity(variant.getStockQuantity() - reqItem.getQuantity());
                variantRepository.save(variant);

                BigDecimal unitPrice = variant.getProduct().getBasePrice()
                        .add(variant.getPriceModifier() != null ? variant.getPriceModifier() : BigDecimal.ZERO);
                BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(reqItem.getQuantity()));
                totalAmount = totalAmount.add(itemTotal);

                OrderItem orderItem = OrderItem.builder()
                        .order(order)
                        .variant(variant)
                        .quantity(reqItem.getQuantity())
                        .unitPrice(unitPrice)
                        .totalPrice(itemTotal)
                        .build();
                order.getItems().add(orderItem);
            }
        } else {
            cart = cartRepository.findByUser(user).orElseThrow(() -> new RuntimeException("Cart not found"));
            if (cart.getItems() == null || cart.getItems().isEmpty()) {
                throw new RuntimeException("Cart is empty");
            }
            for (CartItem cartItem : cart.getItems()) {
                ProductVariant variant = cartItem.getVariant();
                if (variant.getStockQuantity() < cartItem.getQuantity()) {
                    throw new RuntimeException("Sản phẩm " + variant.getProduct().getNameVi() + " (Size "
                            + variant.getSize() + ") không đủ tồn kho!");
                }
                variant.setStockQuantity(variant.getStockQuantity() - cartItem.getQuantity());
                variantRepository.save(variant);

                BigDecimal unitPrice = variant.getProduct().getBasePrice()
                        .add(variant.getPriceModifier() != null ? variant.getPriceModifier() : BigDecimal.ZERO);
                BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));
                totalAmount = totalAmount.add(itemTotal);

                OrderItem orderItem = OrderItem.builder()
                        .order(order)
                        .variant(variant)
                        .quantity(cartItem.getQuantity())
                        .unitPrice(unitPrice)
                        .totalPrice(itemTotal)
                        .build();
                order.getItems().add(orderItem);
            }
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        if (request.getVoucherCode() != null && !request.getVoucherCode().isEmpty()) {
            Voucher voucher = voucherRepository.findByCode(request.getVoucherCode())
                    .orElseThrow(() -> new RuntimeException("Voucher not found"));
            if (totalAmount.compareTo(voucher.getMinOrderValue()) >= 0 && voucher.getIsActive()) {
                if ("PERCENTAGE".equals(voucher.getDiscountType())) {
                    discountAmount = totalAmount.multiply(voucher.getDiscountValue().divide(BigDecimal.valueOf(100)));
                    if (voucher.getMaxDiscountAmount() != null
                            && discountAmount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                        discountAmount = voucher.getMaxDiscountAmount();
                    }
                } else {
                    discountAmount = voucher.getDiscountValue();
                }
                order.setVoucher(voucher);
                voucher.setUsedCount(voucher.getUsedCount() + 1);
                voucherRepository.save(voucher);

                Optional<UserVoucher> uvOpt = userVoucherRepository
                        .findById(new UserVoucherId(userId, voucher.getId()));
                if (uvOpt.isPresent()) {
                    UserVoucher uv = uvOpt.get();
                    uv.setUsageCount(uv.getUsageCount() + 1);
                    userVoucherRepository.save(uv);
                }
            }
        }

        BigDecimal shippingFee = request.getShippingFee() != null ? request.getShippingFee()
                : (request.getShippingAddress().toLowerCase().contains("hcm")
                        || request.getShippingAddress().toLowerCase().contains("hồ chí minh")
                                ? BigDecimal.valueOf(20000)
                                : BigDecimal.valueOf(40000));

        order.setTotalAmount(totalAmount.add(shippingFee));
        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(totalAmount.add(shippingFee).subtract(discountAmount));
        order.setEmail(user.getEmail());
        Order savedOrder = orderRepository.save(order);

        if (!isBuyNow && cart != null) {
            cartService.clearCart(cart.getId());
        }

        // Gửi mail xác nhận ngay lập tức nếu không phải SEPAY
        if (!"SEPAY".equalsIgnoreCase(savedOrder.getPaymentMethod())) {
            emailService.sendOrderConfirmation(user.getEmail(), savedOrder);
        }

        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional
    public OrderResponse placeGuestOrder(OrderRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Giỏ hàng trống");
        }

        BigDecimal totalAmount = BigDecimal.ZERO;

        Order order = Order.builder()
                .user(null) // Guest
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

        for (GuestOrderItemRequest guestItem : request.getItems()) {
            ProductVariant variant = variantRepository.findById(guestItem.getVariantId())
                    .orElseThrow(() -> new RuntimeException("Variant not found: " + guestItem.getVariantId()));

            // Check Inventory
            if (variant.getStockQuantity() < guestItem.getQuantity()) {
                throw new RuntimeException("Sản phẩm " + variant.getProduct().getNameVi() + " (Size "
                        + variant.getSize() + ") không đủ tồn kho!");
            }

            // Deduct Inventory
            variant.setStockQuantity(variant.getStockQuantity() - guestItem.getQuantity());
            variantRepository.save(variant);

            BigDecimal unitPrice = variant.getProduct().getBasePrice()
                    .add(variant.getPriceModifier() != null ? variant.getPriceModifier() : BigDecimal.ZERO);
            BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(guestItem.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .variant(variant)
                    .quantity(guestItem.getQuantity())
                    .unitPrice(unitPrice)
                    .totalPrice(itemTotal)
                    .build();
            order.getItems().add(orderItem);
        }

        BigDecimal discountAmount = BigDecimal.ZERO;

        // So we explicitly DO NOT apply voucher code for guest orders.
        // Even if they send one, we ignore it.

        BigDecimal shippingFee = request.getShippingFee() != null ? request.getShippingFee()
                : (request.getShippingAddress().toLowerCase().contains("hcm")
                        || request.getShippingAddress().toLowerCase().contains("hồ chí minh")
                                ? BigDecimal.valueOf(20000)
                                : BigDecimal.valueOf(40000));

        order.setTotalAmount(totalAmount.add(shippingFee));
        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(totalAmount.add(shippingFee).subtract(discountAmount));

        Order savedOrder = orderRepository.save(order);

        // Gửi mail xác nhận ngay lập tức nếu không phải SEPAY
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            if (!"SEPAY".equalsIgnoreCase(savedOrder.getPaymentMethod())) {
                emailService.sendOrderConfirmation(request.getEmail(), savedOrder);
            }
        }

        return mapToOrderResponse(savedOrder);
    }

    @Override
    public OrderResponse getOrderById(UUID userId, UUID orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
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
        return orderRepository.findAll().stream()
                .filter(o -> o.getUser() != null && o.getUser().getId().equals(userId))
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(UUID orderId, String status) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
        String oldStatus = order.getOrderStatus();
        
        order.setOrderStatus(status);
        if ("DELIVERED".equals(status)) {
            order.setPaymentStatus("PAID");

            // Cập nhật tổng chi tiêu và rank
            if (order.getUser() != null) {
                User user = order.getUser();
                if (user.getTotalSpent() == null) {
                    user.setTotalSpent(BigDecimal.ZERO);
                }
                user.setTotalSpent(user.getTotalSpent().add(order.getFinalAmount()));

                // Cập nhật rank
                BigDecimal total = user.getTotalSpent();
                if (total.compareTo(new BigDecimal("10000000")) >= 0) {
                    user.setRankName("TINH ANH");
                } else if (total.compareTo(new BigDecimal("5000000")) >= 0) {
                    user.setRankName("KIM CƯƠNG");
                } else if (total.compareTo(new BigDecimal("2000000")) >= 0) {
                    user.setRankName("VÀNG");
                } else {
                    user.setRankName("MEMBER");
                }
                userRepository.save(user);
            }
        } else if ("CANCELLED".equals(status) && !"CANCELLED".equals(oldStatus)) {
            // Hoàn lại tồn kho
            for (OrderItem item : order.getItems()) {
                ProductVariant variant = item.getVariant();
                if (variant != null) {
                    variant.setStockQuantity(variant.getStockQuantity() + item.getQuantity());
                    variantRepository.save(variant);
                }
            }
        }
        return mapToOrderResponse(orderRepository.save(order));
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(UUID userId, UUID orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        // Chỉ cho phép hủy nếu đơn hàng đang PENDING và chưa thanh toán
        if ("PAID".equals(order.getPaymentStatus())) {
            throw new RuntimeException("Không thể hủy đơn hàng đã thanh toán");
        }
        if (!"PENDING".equals(order.getOrderStatus())) {
            throw new RuntimeException("Không thể hủy đơn hàng đang được xử lý hoặc giao hàng");
        }

        order.setOrderStatus("CANCELLED");

        // Hoàn lại tồn kho
        for (OrderItem item : order.getItems()) {
            ProductVariant variant = item.getVariant();
            variant.setStockQuantity(variant.getStockQuantity() + item.getQuantity());
            variantRepository.save(variant);
        }

        return mapToOrderResponse(orderRepository.save(order));
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream().map(item -> {
            String productName = "Sản phẩm không còn tồn tại";
            String color = "";
            String size = "";
            String imageUrl = "";
            String slug = "";
            try {
                if (item.getVariant() != null) {
                    color = item.getVariant().getColorVi();
                    size = item.getVariant().getSize();
                    if (item.getVariant().getProduct() != null) {
                        productName = item.getVariant().getProduct().getNameVi();
                        slug = item.getVariant().getProduct().getSlug();
                        if (item.getVariant().getProduct().getImages() != null
                                && !item.getVariant().getProduct().getImages().isEmpty()) {
                            imageUrl = item.getVariant().getProduct().getImages().get(0).getImageUrl();
                        }
                    }
                }
            } catch (Exception e) {
                // Ignore lazy init exception if product or variant was deleted from DB
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
                    .build();
        }).collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .fullName(order.getFullName())
                .phone(order.getPhone())
                .shippingAddress(order.getShippingAddress())
                .orderNote(order.getOrderNote())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .orderStatus(order.getOrderStatus())
                .createdAt(order.getCreatedAt())
                .items(items)
                .build();
    }
}
