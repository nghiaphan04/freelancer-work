package com.workhub.api.dto.request;

import com.workhub.api.entity.EMessageType;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    @NotNull(message = "Receiver ID is required")
    private Long receiverId;

    private String content;

    @Builder.Default
    @JsonSetter(nulls = Nulls.SKIP)
    private EMessageType messageType = EMessageType.TEXT;

    private Long replyToId;
    
    private Long fileId;
}
