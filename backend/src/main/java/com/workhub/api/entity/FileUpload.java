package com.workhub.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity lưu trữ thông tin file upload (Cloudinary)
 * Thiết kế generic để sử dụng cho nhiều module: 
 * - User avatar/cover
 * - Messenger attachments
 * - Job attachments
 * - Application CV/Work submission
 * - Dispute evidence
 */
@Entity
@Table(name = "file_uploads", indexes = {
    @Index(name = "idx_file_upload_uploader", columnList = "uploader_id"),
    @Index(name = "idx_file_upload_usage", columnList = "usage"),
    @Index(name = "idx_file_upload_reference", columnList = "reference_type, reference_id"),
    @Index(name = "idx_file_upload_public_id", columnList = "public_id")
})
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class FileUpload {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ===== CLOUDINARY INFO =====
    
    /**
     * Cloudinary public_id - dùng để xóa file
     */
    @Column(name = "public_id", nullable = false, unique = true, length = 255)
    private String publicId;

    /**
     * URL đầy đủ để truy cập file
     */
    @Column(name = "url", nullable = false, length = 500)
    private String url;

    /**
     * Secure URL (HTTPS)
     */
    @Column(name = "secure_url", nullable = false, length = 500)
    private String secureUrl;

    // ===== FILE INFO =====
    
    /**
     * Tên file gốc khi upload
     */
    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    /**
     * Loại file: IMAGE hoặc DOCUMENT
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "file_type", nullable = false, length = 20)
    private EFileType fileType;

    /**
     * MIME type của file (image/jpeg, application/pdf, ...)
     */
    @Column(name = "mime_type", length = 100)
    private String mimeType;

    /**
     * Định dạng file (jpg, png, pdf, ...)
     */
    @Column(name = "format", length = 20)
    private String format;

    /**
     * Kích thước file (bytes)
     */
    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    /**
     * Chiều rộng (chỉ với ảnh)
     */
    @Column(name = "width")
    private Integer width;

    /**
     * Chiều cao (chỉ với ảnh)
     */
    @Column(name = "height")
    private Integer height;

    // ===== USAGE INFO =====
    
    /**
     * Mục đích sử dụng file
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "usage", nullable = false, length = 30)
    private EFileUsage usage;

    /**
     * Loại entity liên kết (USER, MESSAGE, JOB, APPLICATION, DISPUTE)
     * Dùng kết hợp với reference_id để tìm entity sở hữu file
     */
    @Column(name = "reference_type", length = 50)
    private String referenceType;

    /**
     * ID của entity liên kết
     */
    @Column(name = "reference_id")
    private Long referenceId;

    // ===== OWNERSHIP =====
    
    /**
     * Người upload file
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    private User uploader;

    /**
     * Đánh dấu file đã bị xóa (soft delete)
     */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ===== METHODS =====

    /**
     * Gán file cho một entity cụ thể
     */
    public void assignToReference(String referenceType, Long referenceId) {
        this.referenceType = referenceType;
        this.referenceId = referenceId;
    }

    /**
     * Xóa liên kết với entity
     */
    public void clearReference() {
        this.referenceType = null;
        this.referenceId = null;
    }

    /**
     * Soft delete file
     */
    public void markDeleted() {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
    }

    /**
     * Kiểm tra file có thuộc về user không
     */
    public boolean isOwnedBy(Long userId) {
        return this.uploader != null && this.uploader.getId().equals(userId);
    }

    /**
     * Kiểm tra file có phải là ảnh không
     */
    public boolean isImage() {
        return this.fileType == EFileType.IMAGE;
    }

    /**
     * Kiểm tra file có phải là tài liệu không
     */
    public boolean isDocument() {
        return this.fileType == EFileType.DOCUMENT;
    }

    /**
     * Lấy kích thước file dạng readable (KB, MB)
     */
    public String getReadableSize() {
        if (sizeBytes < 1024) {
            return sizeBytes + " B";
        } else if (sizeBytes < 1024 * 1024) {
            return String.format("%.1f KB", sizeBytes / 1024.0);
        } else {
            return String.format("%.1f MB", sizeBytes / (1024.0 * 1024.0));
        }
    }
}
