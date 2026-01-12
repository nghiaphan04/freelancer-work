package com.workhub.api.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ZaloPayCallbackRequest {

    private String data;
    private String mac;
    private Integer type;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CallbackData {
        
        @JsonProperty("app_id")
        private Integer appId;

        @JsonProperty("app_trans_id")
        private String appTransId;

        @JsonProperty("app_time")
        private Long appTime;

        @JsonProperty("app_user")
        private String appUser;

        private Long amount;
        @JsonProperty("embed_data")
        private String embedData;

        private String item;

        @JsonProperty("zp_trans_id")
        private Long zpTransId;

        @JsonProperty("server_time")
        private Long serverTime;

        private Integer channel;

        @JsonProperty("merchant_user_id")
        private String merchantUserId;

        @JsonProperty("user_fee_amount")
        private Long userFeeAmount;

        @JsonProperty("discount_amount")
        private Long discountAmount;
    }
}
