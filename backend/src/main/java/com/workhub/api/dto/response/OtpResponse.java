package com.workhub.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OtpResponse {
    private String email;
    private Long expiresIn; // seconds
}
