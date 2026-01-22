package com.workhub.api.dto.request;

import com.workhub.api.entity.EJobComplexity;
import com.workhub.api.entity.EJobDuration;
import com.workhub.api.entity.EWorkType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateJobRequest {

    @Data
    public static class ContractTerm {
        private String title;
        private String content;
    }

    @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự")
    private String title;

    private String description;

    private String context;

    private String requirements;

    private String deliverables;

    @Size(max = 10, message = "Tối đa 10 kỹ năng")
    private Set<String> skills;

    private EJobComplexity complexity;

    private EJobDuration duration;

    private EWorkType workType;

    @DecimalMin(value = "0", message = "Ngân sách phải >= 0")
    private BigDecimal budget;

    @Size(max = 10, message = "Mã tiền tệ tối đa 10 ký tự")
    private String currency;

    private LocalDateTime applicationDeadline;

    @Min(value = 1, message = "Thời gian nộp sản phẩm tối thiểu 1 phút")
    private Integer submissionDays;

    @Min(value = 1, message = "Thời gian nghiệm thu tối thiểu 1 phút")
    private Integer reviewDays;

    private List<ContractTerm> terms;

    private String txHash;

    private Long escrowId;

    private String walletAddress;

    private String status;

    private String contractHash;  // Hash từ frontend để đảm bảo khớp với blockchain
}
