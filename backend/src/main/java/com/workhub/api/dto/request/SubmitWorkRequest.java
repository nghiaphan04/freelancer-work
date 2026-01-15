package com.workhub.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmitWorkRequest {
    @NotBlank(message = "Vui lòng nhập link sản phẩm")
    private String url;
    
    private String note;

    private Long fileId;
}
