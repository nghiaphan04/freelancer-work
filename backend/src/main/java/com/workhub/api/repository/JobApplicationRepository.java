package com.workhub.api.repository;

import com.workhub.api.entity.EApplicationStatus;
import com.workhub.api.entity.JobApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    Optional<JobApplication> findByJobIdAndFreelancerId(Long jobId, Long freelancerId);

    boolean existsByJobIdAndFreelancerId(Long jobId, Long freelancerId);

    boolean existsByJobIdAndFreelancerIdAndStatusNot(Long jobId, Long freelancerId, EApplicationStatus status);

    Page<JobApplication> findByFreelancerId(Long freelancerId, Pageable pageable);

    Page<JobApplication> findByFreelancerIdAndStatus(Long freelancerId, EApplicationStatus status, Pageable pageable);

    Page<JobApplication> findByJobId(Long jobId, Pageable pageable);

    Page<JobApplication> findByJobIdAndStatus(Long jobId, EApplicationStatus status, Pageable pageable);

    List<JobApplication> findByJobIdOrderByCreatedAtDesc(Long jobId);

    List<JobApplication> findByJobIdAndStatusAndIdNot(Long jobId, EApplicationStatus status, Long excludeId);
}
