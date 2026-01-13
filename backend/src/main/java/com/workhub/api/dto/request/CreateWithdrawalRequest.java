package com.workhub.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateWithdrawalRequest {
    @NotBlank(message = "Vui lòng nhập lý do")
    private String reason;
}
