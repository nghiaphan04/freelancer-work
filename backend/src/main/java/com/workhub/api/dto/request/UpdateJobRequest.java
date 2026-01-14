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
public class UpdateJobRequest {

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

    @Min(value = 1, message = "Thời gian nộp sản phẩm tối thiểu 1 ngày")
    private Integer submissionDays;

    @Min(value = 2, message = "Thời gian nghiệm thu tối thiểu 2 ngày")
    private Integer reviewDays;
}
