package com.shoes.repository;

import com.shoes.entity.UserVoucher;
import com.shoes.entity.UserVoucherId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserVoucherRepository extends JpaRepository<UserVoucher, UserVoucherId> {
    List<UserVoucher> findByUserId(UUID userId);
    List<UserVoucher> findByUserIdAndIsCollectedTrue(UUID userId);

    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM UserVoucher uv WHERE uv.voucher.id = :voucherId")
    void deleteByVoucherId(@org.springframework.data.repository.query.Param("voucherId") UUID voucherId);
}
