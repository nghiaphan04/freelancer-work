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

    /**
     * Tìm file theo public_id (Cloudinary)
     */
    Optional<FileUpload> findByPublicIdAndIsDeletedFalse(String publicId);

    /**
     * Tìm file theo ID và chưa bị xóa
     */
    Optional<FileUpload> findByIdAndIsDeletedFalse(Long id);

    /**
     * Lấy tất cả file của một user
     */
    Page<FileUpload> findByUploaderIdAndIsDeletedFalseOrderByCreatedAtDesc(
            Long uploaderId, Pageable pageable);

    /**
     * Lấy file theo usage type của một user
     */
    List<FileUpload> findByUploaderIdAndUsageAndIsDeletedFalseOrderByCreatedAtDesc(
            Long uploaderId, EFileUsage usage);

    /**
     * Lấy file theo loại file của một user
     */
    List<FileUpload> findByUploaderIdAndFileTypeAndIsDeletedFalseOrderByCreatedAtDesc(
            Long uploaderId, EFileType fileType);

    /**
     * Lấy file theo reference (entity liên kết)
     */
    List<FileUpload> findByReferenceTypeAndReferenceIdAndIsDeletedFalseOrderByCreatedAtDesc(
            String referenceType, Long referenceId);

    /**
     * Lấy file theo reference và usage
     */
    List<FileUpload> findByReferenceTypeAndReferenceIdAndUsageAndIsDeletedFalse(
            String referenceType, Long referenceId, EFileUsage usage);

    /**
     * Đếm số file của user theo usage
     */
    long countByUploaderIdAndUsageAndIsDeletedFalse(Long uploaderId, EFileUsage usage);

    /**
     * Tính tổng dung lượng file của user (bytes)
     */
    @Query("SELECT COALESCE(SUM(f.sizeBytes), 0) FROM FileUpload f " +
           "WHERE f.uploader.id = :uploaderId AND f.isDeleted = false")
    long sumSizeBytesByUploaderId(@Param("uploaderId") Long uploaderId);

    /**
     * Tìm file chưa được gán reference (orphan files)
     */
    @Query("SELECT f FROM FileUpload f " +
           "WHERE f.uploader.id = :uploaderId " +
           "AND f.referenceType IS NULL " +
           "AND f.isDeleted = false " +
           "ORDER BY f.createdAt DESC")
    List<FileUpload> findOrphanFilesByUploaderId(@Param("uploaderId") Long uploaderId);

    /**
     * Kiểm tra file có thuộc về user không
     */
    boolean existsByIdAndUploaderIdAndIsDeletedFalse(Long id, Long uploaderId);

    /**
     * Lấy avatar hiện tại của user (nếu có)
     */
    @Query("SELECT f FROM FileUpload f " +
           "WHERE f.referenceType = 'USER' " +
           "AND f.referenceId = :userId " +
           "AND f.usage = 'AVATAR' " +
           "AND f.isDeleted = false " +
           "ORDER BY f.createdAt DESC")
    Optional<FileUpload> findCurrentAvatarByUserId(@Param("userId") Long userId);

    /**
     * Lấy cover image hiện tại của user (nếu có)
     */
    @Query("SELECT f FROM FileUpload f " +
           "WHERE f.referenceType = 'USER' " +
           "AND f.referenceId = :userId " +
           "AND f.usage = 'COVER_IMAGE' " +
           "AND f.isDeleted = false " +
           "ORDER BY f.createdAt DESC")
    Optional<FileUpload> findCurrentCoverByUserId(@Param("userId") Long userId);

    /**
     * Lấy tất cả file attachments của một message
     */
    @Query("SELECT f FROM FileUpload f " +
           "WHERE f.referenceType = 'MESSAGE' " +
           "AND f.referenceId = :messageId " +
           "AND f.isDeleted = false " +
           "ORDER BY f.createdAt ASC")
    List<FileUpload> findByMessageId(@Param("messageId") Long messageId);

    /**
     * Lấy tất cả file evidence của một dispute
     */
    @Query("SELECT f FROM FileUpload f " +
           "WHERE f.referenceType = 'DISPUTE' " +
           "AND f.referenceId = :disputeId " +
           "AND f.isDeleted = false " +
           "ORDER BY f.createdAt ASC")
    List<FileUpload> findByDisputeId(@Param("disputeId") Long disputeId);
}
