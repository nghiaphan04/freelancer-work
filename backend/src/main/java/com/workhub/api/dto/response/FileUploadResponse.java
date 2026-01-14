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
    private String publicId;
    private String url;
    private String secureUrl;
    private String originalFilename;
    private String fileType;
    private String mimeType;
    private String format;
    private Long sizeBytes;
    private String readableSize;
    private Integer width;
    private Integer height;
    private String usage;
    private String referenceType;
    private Long referenceId;
    private Long uploaderId;
    private String uploaderName;
    private LocalDateTime createdAt;
}
