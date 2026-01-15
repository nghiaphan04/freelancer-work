package com.workhub.api.repository;

import com.workhub.api.entity.EJobHistoryAction;
import com.workhub.api.entity.JobHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobHistoryRepository extends JpaRepository<JobHistory, Long> {

    List<JobHistory> findByJobIdOrderByCreatedAtDesc(Long jobId);

    Page<JobHistory> findByJobId(Long jobId, Pageable pageable);

    Page<JobHistory> findByJobIdAndAction(Long jobId, EJobHistoryAction action, Pageable pageable);

    @Query("SELECT h FROM JobHistory h WHERE h.job.id = :jobId AND h.user.id = :userId ORDER BY h.createdAt DESC")
    List<JobHistory> findByJobIdAndUserId(@Param("jobId") Long jobId, @Param("userId") Long userId);

    @Query("SELECT h FROM JobHistory h WHERE h.job.id = :jobId AND h.action IN :actions ORDER BY h.createdAt DESC")
    List<JobHistory> findByJobIdAndActionIn(@Param("jobId") Long jobId, @Param("actions") List<EJobHistoryAction> actions);

    long countByJobId(Long jobId);
}
