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
    
    @NotNull(message = "File IDs is required")
    private List<Long> fileIds;
    
    @NotBlank(message = "Reference type is required")
    private String referenceType;
    
    @NotNull(message = "Reference ID is required")
    private Long referenceId;
}
