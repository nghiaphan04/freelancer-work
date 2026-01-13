package com.workhub.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RejectJobRequest {
    
    @NotBlank(message = "Lý do từ chối không được để trống")
    @Size(max = 500, message = "Lý do không được vượt quá 500 ký tự")
    private String reason;
}
