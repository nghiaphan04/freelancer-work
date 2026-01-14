package com.workhub.api.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.workhub.api.dto.response.FileUploadResponse;
import com.workhub.api.entity.*;
import com.workhub.api.exception.FileUploadException;
import com.workhub.api.repository.FileUploadRepository;
import com.workhub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileUploadService {

    private final Cloudinary cloudinary;
    private final FileUploadRepository fileUploadRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.max-image-size:204800}")
    private long maxImageSize; // 200KB default

    @Value("${app.upload.max-document-size:5242880}")
    private long maxDocumentSize; // 5MB default

    @Value("${app.upload.allowed-image-extensions:jpg,jpeg,png,gif,webp}")
    private String allowedImageExtensions;

    @Value("${app.upload.allowed-document-extensions:pdf}")
    private String allowedDocumentExtensions;

    // ===== UPLOAD METHODS =====

    /**
     * Upload ảnh (max 200KB)
     */
    @Transactional
    public FileUploadResponse uploadImage(MultipartFile file, EFileUsage usage, Long uploaderId) {
        validateImageFile(file);
        return uploadToCloudinary(file, EFileType.IMAGE, usage, uploaderId, "image");
    }

    /**
     * Upload tài liệu PDF (max 5MB)
     */
    @Transactional
    public FileUploadResponse uploadDocument(MultipartFile file, EFileUsage usage, Long uploaderId) {
        validateDocumentFile(file);
        return uploadToCloudinary(file, EFileType.DOCUMENT, usage, uploaderId, "raw");
    }

    /**
     * Upload file tự động detect loại
     */
    @Transactional
    public FileUploadResponse uploadFile(MultipartFile file, EFileUsage usage, Long uploaderId) {
        String extension = getFileExtension(file.getOriginalFilename()).toLowerCase();
        
        if (isImageExtension(extension)) {
            return uploadImage(file, usage, uploaderId);
        } else if (isDocumentExtension(extension)) {
            return uploadDocument(file, usage, uploaderId);
        } else {
            throw FileUploadException.invalidFileType(
                allowedImageExtensions + "," + allowedDocumentExtensions);
        }
    }

    /**
     * Upload và gán file cho một entity cụ thể
     */
    @Transactional
    public FileUploadResponse uploadAndAssign(MultipartFile file, EFileUsage usage, 
                                               Long uploaderId, String referenceType, Long referenceId) {
        FileUploadResponse response = uploadFile(file, usage, uploaderId);
        assignFileToReference(response.getId(), referenceType, referenceId);
        return response;
    }

    // ===== ASSIGNMENT METHODS =====

    /**
     * Gán file cho một entity
     */
    @Transactional
    public void assignFileToReference(Long fileId, String referenceType, Long referenceId) {
        FileUpload file = fileUploadRepository.findByIdAndIsDeletedFalse(fileId)
            .orElseThrow(FileUploadException::fileNotFound);
        
        file.assignToReference(referenceType, referenceId);
        fileUploadRepository.save(file);
        
        log.info("Assigned file {} to {} #{}", fileId, referenceType, referenceId);
    }

    /**
     * Gán nhiều file cho một entity
     */
    @Transactional
    public void assignFilesToReference(List<Long> fileIds, String referenceType, Long referenceId) {
        for (Long fileId : fileIds) {
            assignFileToReference(fileId, referenceType, referenceId);
        }
    }

    // ===== DELETE METHODS =====

    /**
     * Soft delete file
     */
    @Transactional
    public void deleteFile(Long fileId, Long userId) {
        FileUpload file = fileUploadRepository.findByIdAndIsDeletedFalse(fileId)
            .orElseThrow(FileUploadException::fileNotFound);
        
        if (!file.isOwnedBy(userId)) {
            throw FileUploadException.accessDenied();
        }
        
        file.markDeleted();
        fileUploadRepository.save(file);
        
        // Xóa file trên Cloudinary (async có thể tốt hơn)
        deleteFromCloudinary(file.getPublicId());
        
        log.info("Deleted file {} by user {}", fileId, userId);
    }

    /**
     * Hard delete file (admin only hoặc cleanup job)
     */
    @Transactional
    public void hardDeleteFile(Long fileId) {
        FileUpload file = fileUploadRepository.findById(fileId)
            .orElseThrow(FileUploadException::fileNotFound);
        
        deleteFromCloudinary(file.getPublicId());
        fileUploadRepository.delete(file);
        
        log.info("Hard deleted file {}", fileId);
    }

    // ===== QUERY METHODS =====

    /**
     * Lấy file theo ID
     */
    public FileUploadResponse getFileById(Long fileId) {
        FileUpload file = fileUploadRepository.findByIdAndIsDeletedFalse(fileId)
            .orElseThrow(FileUploadException::fileNotFound);
        return mapToResponse(file);
    }

    /**
     * Lấy file theo ID và kiểm tra quyền
     */
    public FileUploadResponse getFileByIdAndUser(Long fileId, Long userId) {
        FileUpload file = fileUploadRepository.findByIdAndIsDeletedFalse(fileId)
            .orElseThrow(FileUploadException::fileNotFound);
        
        if (!file.isOwnedBy(userId)) {
            throw FileUploadException.accessDenied();
        }
        
        return mapToResponse(file);
    }

    /**
     * Lấy tất cả file của user
     */
    public Page<FileUploadResponse> getFilesByUser(Long userId, Pageable pageable) {
        return fileUploadRepository
            .findByUploaderIdAndIsDeletedFalseOrderByCreatedAtDesc(userId, pageable)
            .map(this::mapToResponse);
    }

    /**
     * Lấy file theo usage
     */
    public List<FileUploadResponse> getFilesByUserAndUsage(Long userId, EFileUsage usage) {
        return fileUploadRepository
            .findByUploaderIdAndUsageAndIsDeletedFalseOrderByCreatedAtDesc(userId, usage)
            .stream()
            .map(this::mapToResponse)
            .toList();
    }

    /**
     * Lấy file của một entity
     */
    public List<FileUploadResponse> getFilesByReference(String referenceType, Long referenceId) {
        return fileUploadRepository
            .findByReferenceTypeAndReferenceIdAndIsDeletedFalseOrderByCreatedAtDesc(referenceType, referenceId)
            .stream()
            .map(this::mapToResponse)
            .toList();
    }

    /**
     * Lấy avatar hiện tại của user
     */
    public Optional<FileUploadResponse> getCurrentAvatar(Long userId) {
        return fileUploadRepository.findCurrentAvatarByUserId(userId)
            .map(this::mapToResponse);
    }

    /**
     * Lấy cover image hiện tại của user
     */
    public Optional<FileUploadResponse> getCurrentCover(Long userId) {
        return fileUploadRepository.findCurrentCoverByUserId(userId)
            .map(this::mapToResponse);
    }

    /**
     * Lấy attachments của một message
     */
    public List<FileUploadResponse> getMessageAttachments(Long messageId) {
        return fileUploadRepository.findByMessageId(messageId)
            .stream()
            .map(this::mapToResponse)
            .toList();
    }

    /**
     * Lấy evidence của một dispute
     */
    public List<FileUploadResponse> getDisputeEvidence(Long disputeId) {
        return fileUploadRepository.findByDisputeId(disputeId)
            .stream()
            .map(this::mapToResponse)
            .toList();
    }

    // ===== PRIVATE HELPER METHODS =====

    private FileUploadResponse uploadToCloudinary(MultipartFile file, EFileType fileType,
                                                   EFileUsage usage, Long uploaderId,
                                                   String resourceType) {
        try {
            User uploader = userRepository.findById(uploaderId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            // Tạo folder path theo usage
            String folder = "workhub/" + usage.name().toLowerCase();

            // Upload options
            Map<String, Object> options = ObjectUtils.asMap(
                "folder", folder,
                "resource_type", resourceType,
                "unique_filename", true,
                "overwrite", false
            );

            // Upload to Cloudinary
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), options);

            // Extract result
            String publicId = (String) result.get("public_id");
            String url = (String) result.get("url");
            String secureUrl = (String) result.get("secure_url");
            String format = (String) result.get("format");
            Number bytes = (Number) result.get("bytes");
            Number width = (Number) result.get("width");
            Number height = (Number) result.get("height");

            // Create entity
            FileUpload fileUpload = FileUpload.builder()
                .publicId(publicId)
                .url(url)
                .secureUrl(secureUrl)
                .originalFilename(file.getOriginalFilename())
                .fileType(fileType)
                .mimeType(file.getContentType())
                .format(format)
                .sizeBytes(bytes != null ? bytes.longValue() : file.getSize())
                .width(width != null ? width.intValue() : null)
                .height(height != null ? height.intValue() : null)
                .usage(usage)
                .uploader(uploader)
                .build();

            fileUpload = fileUploadRepository.save(fileUpload);

            log.info("Uploaded file {} ({}) by user {}", 
                publicId, fileUpload.getReadableSize(), uploaderId);

            return mapToResponse(fileUpload);

        } catch (IOException e) {
            log.error("Failed to upload file to Cloudinary", e);
            throw FileUploadException.uploadFailed(e.getMessage());
        }
    }

    private void deleteFromCloudinary(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Deleted file from Cloudinary: {}", publicId);
        } catch (IOException e) {
            log.error("Failed to delete file from Cloudinary: {}", publicId, e);
        }
    }

    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw FileUploadException.uploadFailed("File rỗng");
        }

        if (file.getSize() > maxImageSize) {
            throw FileUploadException.fileTooLarge("ảnh", maxImageSize);
        }

        String extension = getFileExtension(file.getOriginalFilename()).toLowerCase();
        if (!isImageExtension(extension)) {
            throw FileUploadException.invalidFileType(allowedImageExtensions);
        }
    }

    private void validateDocumentFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw FileUploadException.uploadFailed("File rỗng");
        }

        if (file.getSize() > maxDocumentSize) {
            throw FileUploadException.fileTooLarge("tài liệu", maxDocumentSize);
        }

        String extension = getFileExtension(file.getOriginalFilename()).toLowerCase();
        if (!isDocumentExtension(extension)) {
            throw FileUploadException.invalidFileType(allowedDocumentExtensions);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }

    private boolean isImageExtension(String extension) {
        return Arrays.asList(allowedImageExtensions.split(","))
            .contains(extension.toLowerCase());
    }

    private boolean isDocumentExtension(String extension) {
        return Arrays.asList(allowedDocumentExtensions.split(","))
            .contains(extension.toLowerCase());
    }

    private FileUploadResponse mapToResponse(FileUpload file) {
        return FileUploadResponse.builder()
            .id(file.getId())
            .publicId(file.getPublicId())
            .url(file.getUrl())
            .secureUrl(file.getSecureUrl())
            .originalFilename(file.getOriginalFilename())
            .fileType(file.getFileType().name())
            .mimeType(file.getMimeType())
            .format(file.getFormat())
            .sizeBytes(file.getSizeBytes())
            .readableSize(file.getReadableSize())
            .width(file.getWidth())
            .height(file.getHeight())
            .usage(file.getUsage().name())
            .referenceType(file.getReferenceType())
            .referenceId(file.getReferenceId())
            .uploaderId(file.getUploader().getId())
            .uploaderName(file.getUploader().getFullName())
            .createdAt(file.getCreatedAt())
            .build();
    }
}
