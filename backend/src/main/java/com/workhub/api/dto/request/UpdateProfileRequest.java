package com.workhub.api.dto.request;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;
    
    @Pattern(regexp = "^(\\+84|84|0)?[0-9]{9,10}$", message = "Phone number is not valid")
    private String phoneNumber;
    
    @Size(max = 500, message = "Avatar URL must be less than 500 characters")
    private String avatarUrl;
}
