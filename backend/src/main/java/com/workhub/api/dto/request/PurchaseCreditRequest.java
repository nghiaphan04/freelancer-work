package com.workhub.api.dto.request;

import com.workhub.api.entity.ECreditPackage;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PurchaseCreditRequest {
    @NotNull(message = "Gói credit không được để trống")
    private ECreditPackage creditPackage;
}
