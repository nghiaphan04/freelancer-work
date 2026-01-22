package com.workhub.api.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ApplyJobRequest {
    private String coverLetter;
    
    @Size(max = 66, message = "Địa chỉ ví không hợp lệ")
    private String walletAddress;
}
