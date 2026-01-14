package com.workhub.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateDisputeRequest {
    
    @NotBlank(message = "Vui lòng mô tả sai phạm")
    private String description;
    
    @NotBlank(message = "Vui lòng cung cấp link bằng chứng (PDF)")
    private String evidenceUrl;

    private Long fileId;
}
