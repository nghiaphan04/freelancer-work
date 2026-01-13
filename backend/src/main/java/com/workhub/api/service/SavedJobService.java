package com.workhub.api.service;

import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.JobResponse;
import com.workhub.api.dto.response.SavedJobResponse;
import com.workhub.api.entity.Job;
import com.workhub.api.entity.SavedJob;
import com.workhub.api.entity.User;
import com.workhub.api.exception.JobNotFoundException;
import com.workhub.api.repository.JobRepository;
import com.workhub.api.repository.SavedJobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SavedJobService {

    private final SavedJobRepository savedJobRepository;
    private final JobRepository jobRepository;
    private final UserService userService;

    @Transactional
    public ApiResponse<SavedJobResponse> saveJob(Long userId, Long jobId) {
        User user = userService.getById(userId);
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException("Không tìm thấy công việc"));

        // Check if already saved
        if (savedJobRepository.existsByJobIdAndUserId(jobId, userId)) {
            return ApiResponse.error("Công việc đã được lưu trước đó");
        }

        SavedJob savedJob = SavedJob.builder()
                .job(job)
                .user(user)
                .build();

        savedJobRepository.save(savedJob);

        return ApiResponse.success("Đã lưu công việc", buildResponse(savedJob));
    }

    @Transactional
    public ApiResponse<Void> unsaveJob(Long userId, Long jobId) {
        if (!savedJobRepository.existsByJobIdAndUserId(jobId, userId)) {
            return ApiResponse.error("Công việc chưa được lưu");
        }

        savedJobRepository.deleteByJobIdAndUserId(jobId, userId);
        return ApiResponse.success("Đã bỏ lưu công việc", null);
    }

    @Transactional
    public ApiResponse<SavedJobResponse> toggleSaveJob(Long userId, Long jobId) {
        if (savedJobRepository.existsByJobIdAndUserId(jobId, userId)) {
            savedJobRepository.deleteByJobIdAndUserId(jobId, userId);
            return ApiResponse.success("Đã bỏ lưu công việc", null);
        } else {
            return saveJob(userId, jobId);
        }
    }

    public ApiResponse<Page<SavedJobResponse>> getSavedJobs(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SavedJob> savedJobs = savedJobRepository.findByUserIdWithJob(userId, pageable);

        Page<SavedJobResponse> responsePage = savedJobs.map(this::buildResponse);
        return ApiResponse.success("Lấy danh sách công việc đã lưu thành công", responsePage);
    }

    public ApiResponse<List<Long>> getSavedJobIds(Long userId) {
        List<Long> jobIds = savedJobRepository.findSavedJobIdsByUserId(userId);
        return ApiResponse.success("Lấy danh sách ID công việc đã lưu thành công", jobIds);
    }

    public ApiResponse<Boolean> isJobSaved(Long userId, Long jobId) {
        boolean isSaved = savedJobRepository.existsByJobIdAndUserId(jobId, userId);
        return ApiResponse.success("Kiểm tra thành công", isSaved);
    }

    private SavedJobResponse buildResponse(SavedJob savedJob) {
        if (savedJob == null) return null;
        
        Job job = savedJob.getJob();
        User employer = job.getEmployer();

        return SavedJobResponse.builder()
                .id(savedJob.getId())
                .jobId(job.getId())
                .jobTitle(job.getTitle())
                .jobDescription(job.getDescription())
                .jobBudget(job.getBudget())
                .jobStatus(job.getStatus().name())
                .jobSkills(job.getSkills())
                .employer(SavedJobResponse.EmployerInfo.builder()
                        .id(employer.getId())
                        .fullName(employer.getFullName())
                        .company(employer.getCompany())
                        .location(employer.getLocation())
                        .avatarUrl(employer.getAvatarUrl())
                        .build())
                .savedAt(savedJob.getCreatedAt())
                .build();
    }
}
