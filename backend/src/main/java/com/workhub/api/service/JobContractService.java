package com.workhub.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workhub.api.dto.request.CreateJobContractRequest;
import com.workhub.api.dto.response.JobContractResponse;
import com.workhub.api.entity.EJobHistoryAction;
import com.workhub.api.entity.EJobStatus;
import com.workhub.api.entity.Job;
import com.workhub.api.entity.JobContract;
import com.workhub.api.entity.User;
import com.workhub.api.repository.JobContractRepository;
import com.workhub.api.repository.JobRepository;
import com.workhub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobContractService {

    private final JobContractRepository jobContractRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final JobHistoryService jobHistoryService;
    private final ObjectMapper objectMapper;

    @Transactional
    public JobContractResponse createContract(Long jobId, CreateJobContractRequest request) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        if (jobContractRepository.existsByJobId(jobId)) {
            throw new RuntimeException("Contract already exists for this job");
        }

        // Sử dụng hash từ frontend nếu có (đảm bảo khớp với blockchain)
        String contractHash = request.getContractHash();
        if (contractHash == null || contractHash.isBlank()) {
            contractHash = generateContractHash(request);
        }
        String termsJson = serializeTerms(request.getTerms());

        JobContract contract = JobContract.builder()
                .job(job)
                .budget(request.getBudget())
                .currency(request.getCurrency() != null ? request.getCurrency() : "APT")
                .deadlineDays(request.getDeadlineDays())
                .reviewDays(request.getReviewDays())
                .requirements(request.getRequirements())
                .deliverables(request.getDeliverables())
                .termsJson(termsJson)
                .contractHash(contractHash)
                .employerSigned(true)
                .employerSignedAt(LocalDateTime.now())
                .freelancerSigned(false)
                .build();

        contract = jobContractRepository.save(contract);
        return JobContractResponse.fromEntity(contract);
    }
    
    private String serializeTerms(List<CreateJobContractRequest.ContractTerm> terms) {
        if (terms == null || terms.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(terms);
        } catch (Exception e) {
            return "[]";
        }
    }

    public JobContractResponse getContractByJobId(Long jobId) {
        JobContract contract = jobContractRepository.findByJobId(jobId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));
        return JobContractResponse.fromEntity(contract);
    }

    public String getContractHash(Long jobId) {
        JobContract contract = jobContractRepository.findByJobId(jobId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));
        return contract.getContractHash();
    }

    @Transactional
    public JobContractResponse signContract(Long jobId, Long freelancerId, String txHash) {
        JobContract contract = jobContractRepository.findByJobId(jobId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));

        if (contract.getFreelancerSigned()) {
            throw new RuntimeException("Contract already signed");
        }

        contract.setFreelancerSigned(true);
        contract.setFreelancerSignedAt(LocalDateTime.now());
        contract.setFreelancerSignatureTx(txHash);
        contract = jobContractRepository.save(contract);

        Job job = contract.getJob();
        if (job.getStatus() == EJobStatus.PENDING_SIGNATURE) {
            job.setStatus(EJobStatus.IN_PROGRESS);
            
            LocalDateTime now = LocalDateTime.now();
            job.setContractSignedAt(now);
            
            // FOR TESTING: Use MINUTES instead of days (change back to plusDays for production)
            int submissionMinutes = job.getSubmissionDays() != null && job.getSubmissionDays() >= 1
                    ? job.getSubmissionDays()
                    : 2;
            LocalDateTime submissionDeadline = now.plusMinutes(submissionMinutes);
            job.setWorkSubmissionDeadline(submissionDeadline);
            
            jobRepository.save(job);

            User freelancer = userRepository.findById(freelancerId).orElse(null);
            if (freelancer != null) {
                jobHistoryService.logHistory(job, freelancer, EJobHistoryAction.WORK_STARTED,
                        "Freelancer đã ký hợp đồng và bắt đầu làm việc");
            }
        }

        return JobContractResponse.fromEntity(contract);
    }

    public String generateContractHash(CreateJobContractRequest request) {
        // Hash format: budget|currency|deadlineDays|reviewDays|requirements|deliverables|term1Title|term1Content|term2Title|term2Content|...
        StringBuilder sb = new StringBuilder();
        sb.append(request.getBudget().toPlainString()).append("|");
        sb.append(request.getCurrency() != null ? request.getCurrency() : "APT").append("|");
        sb.append(request.getDeadlineDays()).append("|");
        sb.append(request.getReviewDays()).append("|");
        sb.append(request.getRequirements() != null ? request.getRequirements() : "").append("|");
        sb.append(request.getDeliverables() != null ? request.getDeliverables() : "");
        
        if (request.getTerms() != null && !request.getTerms().isEmpty()) {
            for (CreateJobContractRequest.ContractTerm term : request.getTerms()) {
                sb.append("|").append(term.getTitle() != null ? term.getTitle() : "");
                sb.append("|").append(term.getContent() != null ? term.getContent() : "");
            }
        }
        
        return sha256(sb.toString());
    }

    public String computeHashFromContract(JobContract contract) {
        StringBuilder sb = new StringBuilder();
        sb.append(contract.getBudget().toPlainString()).append("|");
        sb.append(contract.getCurrency()).append("|");
        sb.append(contract.getDeadlineDays()).append("|");
        sb.append(contract.getReviewDays()).append("|");
        sb.append(contract.getRequirements() != null ? contract.getRequirements() : "").append("|");
        sb.append(contract.getDeliverables() != null ? contract.getDeliverables() : "");
        
        // Parse termsJson and append to hash
        if (contract.getTermsJson() != null && !contract.getTermsJson().isEmpty()) {
            try {
                List<CreateJobContractRequest.ContractTerm> terms = objectMapper.readValue(
                        contract.getTermsJson(), 
                        objectMapper.getTypeFactory().constructCollectionType(List.class, CreateJobContractRequest.ContractTerm.class)
                );
                for (CreateJobContractRequest.ContractTerm term : terms) {
                    sb.append("|").append(term.getTitle() != null ? term.getTitle() : "");
                    sb.append("|").append(term.getContent() != null ? term.getContent() : "");
                }
            } catch (Exception e) {
                // ignore parse error
            }
        }
        
        return sha256(sb.toString());
    }

    private String sha256(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }
}
