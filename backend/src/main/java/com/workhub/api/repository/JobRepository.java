package com.workhub.api.repository;

import com.workhub.api.entity.EJobStatus;
import com.workhub.api.entity.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    Page<Job> findByEmployerId(Long employerId, Pageable pageable);

    Page<Job> findByStatus(EJobStatus status, Pageable pageable);

    Page<Job> findByStatusOrderByCreatedAtDesc(EJobStatus status, Pageable pageable);

    Page<Job> findByEmployerIdAndStatus(Long employerId, EJobStatus status, Pageable pageable);

    @Query("SELECT j FROM Job j WHERE j.status = :status AND " +
           "(LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Job> searchJobs(@Param("keyword") String keyword, 
                         @Param("status") EJobStatus status, 
                         Pageable pageable);

    @Query("SELECT DISTINCT j FROM Job j JOIN j.skills s WHERE s IN :skills AND j.status = :status")
    Page<Job> findBySkillsAndStatus(@Param("skills") List<String> skills, 
                                     @Param("status") EJobStatus status, 
                                     Pageable pageable);

    long countByEmployerId(Long employerId);

    long countByEmployerIdAndStatus(Long employerId, EJobStatus status);

    // Count jobs by status (for admin)
    long countByStatus(EJobStatus status);

    // Get all jobs with details for admin
    @Query("SELECT j FROM Job j JOIN FETCH j.employer ORDER BY j.createdAt DESC")
    Page<Job> findAllWithEmployer(Pageable pageable);

    // Get jobs by status with employer details for admin
    @Query("SELECT j FROM Job j JOIN FETCH j.employer WHERE j.status = :status ORDER BY j.createdAt DESC")
    Page<Job> findByStatusWithEmployer(@Param("status") EJobStatus status, Pageable pageable);

    // Timeout queries for scheduler
    @Query("SELECT j FROM Job j WHERE j.status = :status AND j.workSubmissionDeadline IS NOT NULL AND j.workSubmissionDeadline < :deadline")
    List<Job> findByStatusAndWorkSubmissionDeadlineBefore(@Param("status") EJobStatus status, @Param("deadline") java.time.LocalDateTime deadline);

    @Query("SELECT j FROM Job j WHERE j.status = :status AND j.workReviewDeadline IS NOT NULL AND j.workReviewDeadline < :deadline")
    List<Job> findByStatusAndWorkReviewDeadlineBefore(@Param("status") EJobStatus status, @Param("deadline") java.time.LocalDateTime deadline);
}
