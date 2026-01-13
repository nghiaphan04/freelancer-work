package com.workhub.api.dto.request;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class RequestDisputeResponseRequest {
    
    @Min(value = 1, message = "Số ngày phải lớn hơn 0")
    private int daysToRespond = 3;  // Mặc định 3 ngày
}
