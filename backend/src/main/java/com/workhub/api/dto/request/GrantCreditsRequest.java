package com.workhub.api.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GrantCreditsRequest {
    @NotNull(message = "Số credit không được để trống")
    @Min(value = 1, message = "Số credit phải >= 1")
    private Integer amount;
}
