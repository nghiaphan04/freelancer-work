package com.workhub.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WalletLoginRequest {
    
    @NotBlank(message = "Wallet address is required")
    @Pattern(regexp = "^0x[a-fA-F0-9]{64}$", message = "Invalid wallet address format")
    private String walletAddress;
    
    @NotBlank(message = "Signature is required")
    private String signature;
    
    @NotBlank(message = "Message is required")
    private String message;
    
    @NotBlank(message = "Public key is required")
    private String publicKey;
    
    private String fullName;
}
