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
    
    @NotBlank(message = "Usage is required")
    private String usage;
    
    private String referenceType;
    
    private Long referenceId;
}
