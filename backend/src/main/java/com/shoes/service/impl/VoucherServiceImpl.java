package com.shoes.service.impl;

import com.shoes.dto.VoucherRequest;
import com.shoes.dto.VoucherResponse;
import com.shoes.entity.User;
import com.shoes.entity.UserVoucher;
import com.shoes.entity.UserVoucherId;
import com.shoes.entity.Voucher;
import com.shoes.repository.UserRepository;
import com.shoes.repository.OrderRepository;
import com.shoes.repository.UserVoucherRepository;
import com.shoes.repository.VoucherRepository;
import com.shoes.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
    private final UserRepository userRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final OrderRepository orderRepository;

    @Override
    public List<VoucherResponse> getAllVouchers() {
        return voucherRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public VoucherResponse getVoucherById(UUID id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));
        return mapToResponse(voucher);
    }

    @Override
    public VoucherResponse createVoucher(VoucherRequest request) {
        if (voucherRepository.findByCode(request.getCode()).isPresent()) {
            throw new RuntimeException("Voucher code already exists");
        }

        Voucher voucher = Voucher.builder()
                .code(request.getCode())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minOrderValue(request.getMinOrderValue())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .usageLimit(request.getUsageLimit())
                .usageLimitPerUser(request.getUsageLimitPerUser())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .requiredRank(request.getRequiredRank())
                .imageUrl(request.getImageUrl())
                .usedCount(0)
                .build();
        return mapToResponse(voucherRepository.save(voucher));
    }

    @Override
    public VoucherResponse updateVoucher(UUID id, VoucherRequest request) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));
        
        voucher.setCode(request.getCode());
        voucher.setDiscountType(request.getDiscountType());
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMinOrderValue(request.getMinOrderValue());
        voucher.setMaxDiscountAmount(request.getMaxDiscountAmount());
        voucher.setStartDate(request.getStartDate());
        voucher.setEndDate(request.getEndDate());
        voucher.setUsageLimit(request.getUsageLimit());
        voucher.setUsageLimitPerUser(request.getUsageLimitPerUser());
        voucher.setIsActive(request.getIsActive() != null ? request.getIsActive() : voucher.getIsActive());
        voucher.setRequiredRank(request.getRequiredRank());
        voucher.setImageUrl(request.getImageUrl());
        return mapToResponse(voucherRepository.save(voucher));
    }

    @Override
    @Transactional
    public void deleteVoucher(UUID id) {
        if (orderRepository.existsByVoucherId(id)) {
            throw new RuntimeException("Không thể xóa mã giảm giá đã được sử dụng trong đơn hàng. Vui lòng vô hiệu hóa thay vì xóa.");
        }
        userVoucherRepository.deleteByVoucherId(id);
        voucherRepository.deleteById(id);
    }

    @Override
    public VoucherResponse checkVoucher(String code, BigDecimal orderTotal, UUID userId) {
        String upperCode = code != null ? code.trim().toUpperCase() : "";
        Voucher voucher = voucherRepository.findByCode(upperCode)
                .orElseThrow(() -> new RuntimeException("Mã giảm giá không tồn tại"));

        if (!voucher.getIsActive()) {
            throw new RuntimeException("Mã giảm giá đã ngừng hoạt động");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(voucher.getStartDate())) {
            throw new RuntimeException("Mã giảm giá chưa đến thời gian áp dụng");
        }
        if (now.isAfter(voucher.getEndDate())) {
            throw new RuntimeException("Mã giảm giá đã hết hạn");
        }

        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new RuntimeException("Mã giảm giá đã hết lượt sử dụng");
        }

        if (orderTotal != null && voucher.getMinOrderValue() != null && orderTotal.compareTo(voucher.getMinOrderValue()) < 0) {
            throw new RuntimeException("Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã này");
        }

        // Validate rank and usage limit per user
        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            String userRank = user != null && user.getRankName() != null ? user.getRankName() : "MEMBER";

            if (voucher.getRequiredRank() != null && !voucher.getRequiredRank().isEmpty()) {
                int userRankValue = getRankValue(userRank);
                int requiredRankValue = getRankValue(voucher.getRequiredRank());
                
                if (userRankValue < requiredRankValue) {
                    throw new RuntimeException("Bạn cần hạng " + voucher.getRequiredRank() + " trở lên để sử dụng mã này.");
                }
            }

            // Check usage limit per user
            if (voucher.getUsageLimitPerUser() != null) {
                Optional<UserVoucher> uvOpt = userVoucherRepository.findById(new UserVoucherId(userId, voucher.getId()));
                if (uvOpt.isPresent() && uvOpt.get().getUsageCount() >= voucher.getUsageLimitPerUser()) {
                    throw new RuntimeException("Bạn đã hết lượt sử dụng mã này");
                }
            }
        }

        return mapToResponse(voucher);
    }

    @Override
    public List<VoucherResponse> getAvailableVouchers(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        String userRank = user.getRankName() != null ? user.getRankName() : "MEMBER";
        int userRankValue = getRankValue(userRank);
        
        LocalDateTime now = LocalDateTime.now();
        List<Voucher> activeVouchers = voucherRepository.findAll().stream()
                .filter(Voucher::getIsActive)
                .filter(v -> v.getStartDate().isBefore(now) && v.getEndDate().isAfter(now))
                .filter(v -> v.getUsageLimit() == null || v.getUsedCount() < v.getUsageLimit())
                .filter(v -> {
                    if (v.getRequiredRank() == null || v.getRequiredRank().isEmpty()) return true;
                    return getRankValue(v.getRequiredRank()) <= userRankValue;
                })
                .collect(Collectors.toList());

        return activeVouchers.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<VoucherResponse> getMyVouchers(UUID userId) {
        List<UserVoucher> userVouchers = userVoucherRepository.findByUserIdAndIsCollectedTrue(userId);
        return userVouchers.stream()
                .map(uv -> mapToResponse(uv.getVoucher()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public VoucherResponse claimVoucher(String code, UUID userId) {
        String upperCode = code != null ? code.trim().toUpperCase() : "";
        Voucher voucher = voucherRepository.findByCode(upperCode)
                .orElseThrow(() -> new RuntimeException("Mã giảm giá không tồn tại"));

        if (!voucher.getIsActive()) {
            throw new RuntimeException("Mã giảm giá đã ngừng hoạt động");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(voucher.getStartDate())) {
            throw new RuntimeException("Mã giảm giá chưa đến thời gian áp dụng");
        }
        if (now.isAfter(voucher.getEndDate())) {
            throw new RuntimeException("Mã giảm giá đã hết hạn");
        }

        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new RuntimeException("Mã giảm giá đã được sử dụng hết");
        }

        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        String userRank = user.getRankName() != null ? user.getRankName() : "MEMBER";

        if (voucher.getRequiredRank() != null && !voucher.getRequiredRank().isEmpty()) {
            int userRankValue = getRankValue(userRank);
            int requiredRankValue = getRankValue(voucher.getRequiredRank());
            
            if (userRankValue < requiredRankValue) {
                throw new RuntimeException("Bạn cần hạng " + voucher.getRequiredRank() + " trở lên để nhận mã này.");
            }
        }

        UserVoucherId uvId = new UserVoucherId(userId, voucher.getId());
        Optional<UserVoucher> uvOpt = userVoucherRepository.findById(uvId);
        
        if (uvOpt.isPresent()) {
            UserVoucher uv = uvOpt.get();
            if (uv.getIsCollected()) {
                throw new RuntimeException("Bạn đã lưu mã giảm giá này rồi");
            } else {
                uv.setIsCollected(true);
                userVoucherRepository.save(uv);
            }
        } else {
            UserVoucher newUv = UserVoucher.builder()
                    .id(uvId)
                    .user(user)
                    .voucher(voucher)
                    .usageCount(0)
                    .isCollected(true)
                    .build();
            userVoucherRepository.save(newUv);
        }

        return mapToResponse(voucher);
    }

    private int getRankValue(String rank) {
        if (rank == null) return 0;
        switch (rank.toUpperCase()) {
            case "MEMBER": return 0;
            case "BẠC": return 1;
            case "VÀNG": return 2;
            case "KIM CƯƠNG": return 3;
            case "TINH ANH": return 4;
            default: return 0;
        }
    }

    private VoucherResponse mapToResponse(Voucher voucher) {
        return VoucherResponse.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .minOrderValue(voucher.getMinOrderValue())
                .maxDiscountAmount(voucher.getMaxDiscountAmount())
                .startDate(voucher.getStartDate())
                .endDate(voucher.getEndDate())
                .usageLimit(voucher.getUsageLimit())
                .usageLimitPerUser(voucher.getUsageLimitPerUser())
                .usedCount(voucher.getUsedCount())
                .isActive(voucher.getIsActive())
                .requiredRank(voucher.getRequiredRank())
                .imageUrl(voucher.getImageUrl())
                .build();
    }
}
