package com.workhub.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResolveDisputeRequest {
    
    @NotNull(message = "Vui lòng chọn bên thắng")
    private Boolean employerWins;  // true = employer wins, false = freelancer wins
    
    @NotBlank(message = "Vui lòng nhập ghi chú quyết định")
    private String note;
}
