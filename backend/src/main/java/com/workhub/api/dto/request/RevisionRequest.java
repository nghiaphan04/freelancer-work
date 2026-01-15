package com.workhub.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RevisionRequest {
    @NotBlank(message = "Vui lòng nhập ghi chú yêu cầu chỉnh sửa")
    private String note;
}
