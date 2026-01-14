package com.workhub.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignFileRequest {
    
    /**
     * Danh sách ID file cần gán
     */
    @NotNull(message = "File IDs is required")
    private List<Long> fileIds;
    
    /**
     * Loại entity liên kết
     * Ví dụ: USER, MESSAGE, JOB, APPLICATION, DISPUTE
     */
    @NotBlank(message = "Reference type is required")
    private String referenceType;
    
    /**
     * ID của entity liên kết
     */
    @NotNull(message = "Reference ID is required")
    private Long referenceId;
}
