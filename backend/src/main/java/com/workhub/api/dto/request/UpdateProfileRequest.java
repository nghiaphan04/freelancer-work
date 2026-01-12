package com.workhub.api.dto.request;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

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
    
    @Size(max = 500, message = "Cover image URL must be less than 500 characters")
    private String coverImageUrl;
    
    @Size(max = 200, message = "Title must be less than 200 characters")
    private String title;
    
    @Size(max = 100, message = "Location must be less than 100 characters")
    private String location;
    
    @Size(max = 200, message = "Company must be less than 200 characters")
    private String company;
    
    @Size(max = 5000, message = "Bio must be less than 5000 characters")
    private String bio;
    
    private Set<String> skills;
    
    private Boolean isOpenToWork;
    
    private Set<String> openToWorkRoles;

    @Size(max = 50, message = "Bank account number must be less than 50 characters")
    private String bankAccountNumber;

    @Size(max = 100, message = "Bank name must be less than 100 characters")
    private String bankName;
}
