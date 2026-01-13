package com.workhub.api.repository;

import com.workhub.api.entity.SavedJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {

    @Query("SELECT sj FROM SavedJob sj JOIN FETCH sj.job j JOIN FETCH j.employer WHERE sj.user.id = :userId ORDER BY sj.createdAt DESC")
    Page<SavedJob> findByUserIdWithJob(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT sj FROM SavedJob sj WHERE sj.user.id = :userId")
    List<SavedJob> findAllByUserId(@Param("userId") Long userId);

    Optional<SavedJob> findByJobIdAndUserId(Long jobId, Long userId);

    boolean existsByJobIdAndUserId(Long jobId, Long userId);

    void deleteByJobIdAndUserId(Long jobId, Long userId);

    @Query("SELECT sj.job.id FROM SavedJob sj WHERE sj.user.id = :userId")
    List<Long> findSavedJobIdsByUserId(@Param("userId") Long userId);

    long countByUserId(Long userId);
}
