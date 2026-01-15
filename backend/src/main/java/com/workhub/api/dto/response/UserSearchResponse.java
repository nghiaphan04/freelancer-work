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
    private String email;
    private String avatarUrl;
    private Boolean canSendRequest; // true nếu có thể gửi yêu cầu kết bạn
    private String relationStatus;  // NONE, PENDING, ACCEPTED, BLOCKED, REJECTED
    private Long conversationId;    // ID của conversation nếu có
    private Integer trustScore;     // Điểm uy tín (UT)
    private Integer untrustScore;   // Điểm không uy tín (KUT)

    public static UserSearchResponse fromEntity(User user, boolean canSendRequest, String relationStatus, Long conversationId) {
        return UserSearchResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .canSendRequest(canSendRequest)
                .relationStatus(relationStatus)
                .conversationId(conversationId)
                .trustScore(user.getTrustScore() != null ? user.getTrustScore() : 0)
                .untrustScore(user.getUntrustScore() != null ? user.getUntrustScore() : 0)
                .build();
    }
}
