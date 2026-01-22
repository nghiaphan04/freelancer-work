package com.workhub.api.repository;

import com.workhub.api.entity.Dispute;
import com.workhub.api.entity.EDisputeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {

    @Query("SELECT d FROM Dispute d " +
           "LEFT JOIN FETCH d.employer " +
           "LEFT JOIN FETCH d.freelancer " +
           "WHERE d.job.id = :jobId")
    Optional<Dispute> findByJobId(@Param("jobId") Long jobId);

    boolean existsByJobIdAndStatusIn(Long jobId, List<EDisputeStatus> statuses);

    // Admin queries
    Page<Dispute> findByStatus(EDisputeStatus status, Pageable pageable);

    @Query("SELECT d FROM Dispute d WHERE d.status IN :statuses ORDER BY d.createdAt ASC")
    Page<Dispute> findByStatusIn(@Param("statuses") List<EDisputeStatus> statuses, Pageable pageable);

    @Query("SELECT d FROM Dispute d " +
           "JOIN FETCH d.employer " +
           "JOIN FETCH d.freelancer " +
           "JOIN FETCH d.job " +
           "WHERE d.status = :status AND d.evidenceDeadline IS NOT NULL AND d.evidenceDeadline < :now")
    List<Dispute> findExpiredEvidenceDeadlines(@Param("status") EDisputeStatus status, @Param("now") LocalDateTime now);

    long countByStatus(EDisputeStatus status);
    
    @Query("SELECT d FROM Dispute d WHERE d.status IN :statuses")
    List<Dispute> findAllByStatusIn(@Param("statuses") List<EDisputeStatus> statuses);

    @Query("SELECT COUNT(d) FROM Dispute d WHERE d.status IN :statuses")
    long countByStatusIn(@Param("statuses") List<EDisputeStatus> statuses);

    @Modifying
    void deleteByJobId(Long jobId);

    // Find disputes that are resolved but not yet paid out on blockchain
    @Query("SELECT d FROM Dispute d " +
           "JOIN FETCH d.employer " +
           "JOIN FETCH d.freelancer " +
           "JOIN FETCH d.job " +
           "WHERE d.status IN ('EMPLOYER_WON', 'FREELANCER_WON') " +
           "AND (d.blockchainResolved = false OR d.blockchainResolved IS NULL)")
    List<Dispute> findPendingBlockchainResolution();
}
