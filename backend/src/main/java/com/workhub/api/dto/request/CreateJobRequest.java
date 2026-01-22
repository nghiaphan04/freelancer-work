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
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateJobRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự")
    private String title;

    @NotBlank(message = "Mô tả công việc không được để trống")
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

    @Future(message = "Hạn nộp hồ sơ phải trong tương lai")
    private LocalDateTime applicationDeadline;

    @Min(value = 1, message = "Thời gian nộp sản phẩm tối thiểu 1 phút")
    private Integer submissionDays;

    @Min(value = 1, message = "Thời gian nghiệm thu tối thiểu 1 phút")
    private Integer reviewDays;

    private Long escrowId;

    @Size(max = 66, message = "Địa chỉ ví không hợp lệ")
    private String walletAddress;

    @Size(max = 66, message = "Transaction hash không hợp lệ")
    private String txHash;

    private Boolean saveAsDraft;
}
