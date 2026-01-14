package com.workhub.api.repository;

import com.workhub.api.entity.EFileType;
import com.workhub.api.entity.EFileUsage;
import com.workhub.api.entity.FileUpload;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileUploadRepository extends JpaRepository<FileUpload, Long> {

    Optional<FileUpload> findByPublicIdAndIsDeletedFalse(String publicId);

    Optional<FileUpload> findByIdAndIsDeletedFalse(Long id);

    Page<FileUpload> findByUploaderIdAndIsDeletedFalseOrderByCreatedAtDesc(
            Long uploaderId, Pageable pageable);

    List<FileUpload> findByUploaderIdAndUsageAndIsDeletedFalseOrderByCreatedAtDesc(
            Long uploaderId, EFileUsage usage);

    List<FileUpload> findByUploaderIdAndFileTypeAndIsDeletedFalseOrderByCreatedAtDesc(
            Long uploaderId, EFileType fileType);

    List<FileUpload> findByReferenceTypeAndReferenceIdAndIsDeletedFalseOrderByCreatedAtDesc(
            String referenceType, Long referenceId);

    List<FileUpload> findByReferenceTypeAndReferenceIdAndUsageAndIsDeletedFalse(
            String referenceType, Long referenceId, EFileUsage usage);

    long countByUploaderIdAndUsageAndIsDeletedFalse(Long uploaderId, EFileUsage usage);

    @Query("SELECT COALESCE(SUM(f.sizeBytes), 0) FROM FileUpload f " +
           "WHERE f.uploader.id = :uploaderId AND f.isDeleted = false")
    long sumSizeBytesByUploaderId(@Param("uploaderId") Long uploaderId);

    @Query("SELECT f FROM FileUpload f " +
           "WHERE f.uploader.id = :uploaderId " +
           "AND f.referenceType IS NULL " +
           "AND f.isDeleted = false " +
           "ORDER BY f.createdAt DESC")
    List<FileUpload> findOrphanFilesByUploaderId(@Param("uploaderId") Long uploaderId);

    boolean existsByIdAndUploaderIdAndIsDeletedFalse(Long id, Long uploaderId);

    @Query("SELECT f FROM FileUpload f " +
           "WHERE f.referenceType = 'USER' " +
           "AND f.referenceId = :userId " +
           "AND f.usage = 'AVATAR' " +
           "AND f.isDeleted = false " +
           "ORDER BY f.createdAt DESC")
    Optional<FileUpload> findCurrentAvatarByUserId(@Param("userId") Long userId);

    @Query("SELECT f FROM FileUpload f " +
           "WHERE f.referenceType = 'USER' " +
           "AND f.referenceId = :userId " +
           "AND f.usage = 'COVER_IMAGE' " +
           "AND f.isDeleted = false " +
           "ORDER BY f.createdAt DESC")
    Optional<FileUpload> findCurrentCoverByUserId(@Param("userId") Long userId);

    @Query("SELECT f FROM FileUpload f " +
           "WHERE f.referenceType = 'MESSAGE' " +
           "AND f.referenceId = :messageId " +
           "AND f.isDeleted = false " +
           "ORDER BY f.createdAt ASC")
    List<FileUpload> findByMessageId(@Param("messageId") Long messageId);

    @Query("SELECT f FROM FileUpload f " +
           "WHERE f.referenceType = 'DISPUTE' " +
           "AND f.referenceId = :disputeId " +
           "AND f.isDeleted = false " +
           "ORDER BY f.createdAt ASC")
    List<FileUpload> findByDisputeId(@Param("disputeId") Long disputeId);
}
