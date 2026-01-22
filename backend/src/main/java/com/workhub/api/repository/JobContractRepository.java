package com.workhub.api.repository;

import com.workhub.api.entity.JobContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobContractRepository extends JpaRepository<JobContract, Long> {
    
    Optional<JobContract> findByJobId(Long jobId);
    
    boolean existsByJobId(Long jobId);
}
