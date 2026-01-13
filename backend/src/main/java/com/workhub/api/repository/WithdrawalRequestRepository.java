package com.workhub.api.repository;

import com.workhub.api.entity.EWithdrawalRequestStatus;
import com.workhub.api.entity.WithdrawalRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, Long> {

    Optional<WithdrawalRequest> findByJobIdAndStatus(Long jobId, EWithdrawalRequestStatus status);

    List<WithdrawalRequest> findByJobIdOrderByCreatedAtDesc(Long jobId);

    Page<WithdrawalRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId, Pageable pageable);

    boolean existsByJobIdAndStatus(Long jobId, EWithdrawalRequestStatus status);

    long countByStatus(EWithdrawalRequestStatus status);
}
