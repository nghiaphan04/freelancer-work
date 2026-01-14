package com.workhub.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

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
    
    @Column(name = "public_id", nullable = false, unique = true, length = 255)
    private String publicId;

    @Column(name = "url", nullable = false, length = 500)
    private String url;

    @Column(name = "secure_url", nullable = false, length = 500)
    private String secureUrl;
    
    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_type", nullable = false, length = 20)
    private EFileType fileType;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "format", length = 20)
    private String format;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "usage", nullable = false, length = 30)
    private EFileUsage usage;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    private User uploader;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public void assignToReference(String referenceType, Long referenceId) {
        this.referenceType = referenceType;
        this.referenceId = referenceId;
    }

    public void clearReference() {
        this.referenceType = null;
        this.referenceId = null;
    }

    public void markDeleted() {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
    }

    public boolean isOwnedBy(Long userId) {
        return this.uploader != null && this.uploader.getId().equals(userId);
    }

    public boolean isImage() {
        return this.fileType == EFileType.IMAGE;
    }

    public boolean isDocument() {
        return this.fileType == EFileType.DOCUMENT;
    }

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
