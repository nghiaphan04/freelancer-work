package com.workhub.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {
    
    private Long id;
    
    // Cloudinary info
    private String publicId;
    private String url;
    private String secureUrl;
    
    // File info
    private String originalFilename;
    private String fileType;        // IMAGE, DOCUMENT
    private String mimeType;
    private String format;          // jpg, png, pdf, etc.
    private Long sizeBytes;
    private String readableSize;    // "150 KB", "2.5 MB"
    private Integer width;          // Chỉ với ảnh
    private Integer height;         // Chỉ với ảnh
    
    // Usage info
    private String usage;           // AVATAR, MESSAGE_IMAGE, etc.
    private String referenceType;   // USER, MESSAGE, JOB, etc.
    private Long referenceId;
    
    // Uploader info
    private Long uploaderId;
    private String uploaderName;
    
    private LocalDateTime createdAt;
}
