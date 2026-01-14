package com.workhub.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadRequest {
    
    /**
     * Mục đích sử dụng file
     * Giá trị hợp lệ: AVATAR, COVER_IMAGE, MESSAGE_IMAGE, MESSAGE_FILE, 
     *                 JOB_ATTACHMENT, APPLICATION_CV, WORK_SUBMISSION, 
     *                 DISPUTE_EVIDENCE, OTHER
     */
    @NotBlank(message = "Usage is required")
    private String usage;
    
    /**
     * Loại entity liên kết (optional)
     * Ví dụ: USER, MESSAGE, JOB, APPLICATION, DISPUTE
     */
    private String referenceType;
    
    /**
     * ID của entity liên kết (optional)
     */
    private Long referenceId;
}
