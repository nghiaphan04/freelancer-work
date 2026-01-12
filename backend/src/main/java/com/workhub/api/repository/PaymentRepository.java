package com.workhub.api.repository;

import com.workhub.api.entity.EPaymentStatus;
import com.workhub.api.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByAppTransId(String appTransId);

    Optional<Payment> findByZpTransId(Long zpTransId);

    Optional<Payment> findByJobId(Long jobId);

    Optional<Payment> findByJobIdAndStatus(Long jobId, EPaymentStatus status);

    Page<Payment> findByUserId(Long userId, Pageable pageable);

    Page<Payment> findByUserIdAndStatus(Long userId, EPaymentStatus status, Pageable pageable);

    boolean existsByJobIdAndStatus(Long jobId, EPaymentStatus status);

    Long countByStatus(EPaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM Payment p WHERE p.status = :status")
    BigDecimal sumTotalAmountByStatus(@Param("status") EPaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.jobAmount), 0) FROM Payment p WHERE p.status = :status")
    BigDecimal sumJobAmountByStatus(@Param("status") EPaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.feeAmount), 0) FROM Payment p WHERE p.status = :status")
    BigDecimal sumFeeAmountByStatus(@Param("status") EPaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM Payment p WHERE p.status = :status AND p.paidAt >= :fromDate")
    BigDecimal sumTotalAmountByStatusAndPaidAtAfter(@Param("status") EPaymentStatus status, 
                                                    @Param("fromDate") LocalDateTime fromDate);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = :status AND p.paidAt >= :fromDate")
    Long countByStatusAndPaidAtAfter(@Param("status") EPaymentStatus status, 
                                     @Param("fromDate") LocalDateTime fromDate);

    Page<Payment> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Payment> findByStatusOrderByCreatedAtDesc(EPaymentStatus status, Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE p.appTransId LIKE %:keyword% OR p.job.title LIKE %:keyword% ORDER BY p.createdAt DESC")
    Page<Payment> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    List<Payment> findTop10ByStatusOrderByPaidAtDesc(EPaymentStatus status);
}
