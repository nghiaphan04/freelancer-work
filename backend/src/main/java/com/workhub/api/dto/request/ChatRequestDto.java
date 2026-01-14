package com.workhub.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequestDto {

    @NotNull(message = "Receiver ID is required")
    private Long receiverId;

    @NotBlank(message = "Message is required")
    private String message;
}
