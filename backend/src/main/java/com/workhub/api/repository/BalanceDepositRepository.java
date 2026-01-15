package com.workhub.api.repository;

import com.workhub.api.entity.BalanceDeposit;
import com.workhub.api.entity.EDepositStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface BalanceDepositRepository extends JpaRepository<BalanceDeposit, Long> {

    Optional<BalanceDeposit> findByAppTransId(String appTransId);

    Page<BalanceDeposit> findByUserId(Long userId, Pageable pageable);

    Page<BalanceDeposit> findByUserIdAndStatus(Long userId, EDepositStatus status, Pageable pageable);

    Page<BalanceDeposit> findByStatusOrderByCreatedAtDesc(EDepositStatus status, Pageable pageable);

    Page<BalanceDeposit> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Long countByStatus(EDepositStatus status);

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM BalanceDeposit d WHERE d.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") EDepositStatus status);

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM BalanceDeposit d WHERE d.status = :status AND d.paidAt >= :fromDate")
    BigDecimal sumAmountByStatusAndPaidAtAfter(@Param("status") EDepositStatus status,
                                               @Param("fromDate") LocalDateTime fromDate);

    @Query("SELECT COUNT(d) FROM BalanceDeposit d WHERE d.status = :status AND d.paidAt >= :fromDate")
    Long countByStatusAndPaidAtAfter(@Param("status") EDepositStatus status,
                                     @Param("fromDate") LocalDateTime fromDate);
}
