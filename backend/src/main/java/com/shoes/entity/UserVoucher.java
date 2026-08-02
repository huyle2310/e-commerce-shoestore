package com.shoes.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserVoucher {

    @EmbeddedId
    private UserVoucherId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("voucherId")
    @JoinColumn(name = "voucher_id")
    private Voucher voucher;

    @Column(name = "usage_count")
    private Integer usageCount;

    @Column(name = "is_collected")
    private Boolean isCollected;

    @PrePersist
    protected void onCreate() {
        if (usageCount == null) usageCount = 0;
        if (isCollected == null) isCollected = true;
    }
}
