package com.workhub.api.repository;

import com.workhub.api.entity.CreditPurchase;
import com.workhub.api.entity.EPaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CreditPurchaseRepository extends JpaRepository<CreditPurchase, Long> {

    Optional<CreditPurchase> findByAppTransId(String appTransId);

    Page<CreditPurchase> findByUserId(Long userId, Pageable pageable);

    Page<CreditPurchase> findByUserIdAndStatus(Long userId, EPaymentStatus status, Pageable pageable);

    Page<CreditPurchase> findByStatusOrderByCreatedAtDesc(EPaymentStatus status, Pageable pageable);

    Page<CreditPurchase> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
