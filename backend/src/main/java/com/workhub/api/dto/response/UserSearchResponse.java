package com.workhub.api.dto.response;

import com.workhub.api.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchResponse {

    private Long id;
    private String fullName;
    private String walletAddress;
    private String avatarUrl;
    private Boolean canSendRequest;
    private String relationStatus;
    private Long conversationId;
    private Integer trustScore;
    private Integer untrustScore;

    public static UserSearchResponse fromEntity(User user, boolean canSendRequest, String relationStatus, Long conversationId) {
        return UserSearchResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .walletAddress(user.getWalletAddress())
                .avatarUrl(user.getAvatarUrl())
                .canSendRequest(canSendRequest)
                .relationStatus(relationStatus)
                .conversationId(conversationId)
                .trustScore(user.getTrustScore() != null ? user.getTrustScore() : 0)
                .untrustScore(user.getUntrustScore() != null ? user.getUntrustScore() : 0)
                .build();
    }
}
