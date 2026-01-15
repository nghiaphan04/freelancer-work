package com.workhub.api.repository;

import com.workhub.api.entity.Dispute;
import com.workhub.api.entity.EDisputeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {

    Optional<Dispute> findByJobId(Long jobId);

    boolean existsByJobIdAndStatusIn(Long jobId, List<EDisputeStatus> statuses);

    // Admin queries
    Page<Dispute> findByStatus(EDisputeStatus status, Pageable pageable);

    @Query("SELECT d FROM Dispute d WHERE d.status IN :statuses ORDER BY d.createdAt ASC")
    Page<Dispute> findByStatusIn(@Param("statuses") List<EDisputeStatus> statuses, Pageable pageable);

    // For scheduler - find expired freelancer response deadlines
    @Query("SELECT d FROM Dispute d WHERE d.status = :status AND d.freelancerDeadline IS NOT NULL AND d.freelancerDeadline < :now")
    List<Dispute> findExpiredFreelancerDeadlines(@Param("status") EDisputeStatus status, @Param("now") LocalDateTime now);

    // Count pending disputes for admin
    long countByStatus(EDisputeStatus status);

    @Query("SELECT COUNT(d) FROM Dispute d WHERE d.status IN :statuses")
    long countByStatusIn(@Param("statuses") List<EDisputeStatus> statuses);
}
