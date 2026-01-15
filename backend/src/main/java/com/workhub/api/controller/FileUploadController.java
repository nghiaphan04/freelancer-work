package com.workhub.api.controller;

import com.workhub.api.dto.request.AssignFileRequest;
import com.workhub.api.dto.response.ApiResponse;
import com.workhub.api.dto.response.FileUploadResponse;
import com.workhub.api.entity.EFileUsage;
import com.workhub.api.exception.FileUploadException;
import com.workhub.api.security.UserDetailsImpl;
import com.workhub.api.service.FileUploadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileUploadService fileUploadService;

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadImage(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam("file") MultipartFile file,
            @RequestParam("usage") String usage,
            @RequestParam(value = "referenceType", required = false) String referenceType,
            @RequestParam(value = "referenceId", required = false) Long referenceId) {

        EFileUsage fileUsage = parseUsage(usage);
        FileUploadResponse response;

        if (referenceType != null && referenceId != null) {
            response = fileUploadService.uploadAndAssign(file, fileUsage, 
                    userDetails.getId(), referenceType, referenceId);
        } else {
            response = fileUploadService.uploadImage(file, fileUsage, userDetails.getId());
        }

        return ResponseEntity.ok(ApiResponse.success("Upload ảnh thành công", response));
    }

    @PostMapping(value = "/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadDocument(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam("file") MultipartFile file,
            @RequestParam("usage") String usage,
            @RequestParam(value = "referenceType", required = false) String referenceType,
            @RequestParam(value = "referenceId", required = false) Long referenceId) {

        EFileUsage fileUsage = parseUsage(usage);
        FileUploadResponse response;

        if (referenceType != null && referenceId != null) {
            response = fileUploadService.uploadAndAssign(file, fileUsage,
                    userDetails.getId(), referenceType, referenceId);
        } else {
            response = fileUploadService.uploadDocument(file, fileUsage, userDetails.getId());
        }

        return ResponseEntity.ok(ApiResponse.success("Upload tài liệu thành công", response));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadFile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam("file") MultipartFile file,
            @RequestParam("usage") String usage,
            @RequestParam(value = "referenceType", required = false) String referenceType,
            @RequestParam(value = "referenceId", required = false) Long referenceId) {

        EFileUsage fileUsage = parseUsage(usage);
        FileUploadResponse response;

        if (referenceType != null && referenceId != null) {
            response = fileUploadService.uploadAndAssign(file, fileUsage,
                    userDetails.getId(), referenceType, referenceId);
        } else {
            response = fileUploadService.uploadFile(file, fileUsage, userDetails.getId());
        }

        return ResponseEntity.ok(ApiResponse.success("Upload thành công", response));
    }

    @PostMapping("/assign")
    public ResponseEntity<ApiResponse<Void>> assignFiles(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody AssignFileRequest request) {

        fileUploadService.assignFilesToReference(
                request.getFileIds(),
                request.getReferenceType(),
                request.getReferenceId());

        return ResponseEntity.ok(ApiResponse.success("Gán file thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FileUploadResponse>> getFile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {

        FileUploadResponse response = fileUploadService.getFileById(id);
        return ResponseEntity.ok(ApiResponse.success("Thành công", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Page<FileUploadResponse>>> getMyFiles(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<FileUploadResponse> response = fileUploadService.getFilesByUser(
                userDetails.getId(), pageable);

        return ResponseEntity.ok(ApiResponse.success("Thành công", response));
    }

    @GetMapping("/me/by-usage")
    public ResponseEntity<ApiResponse<List<FileUploadResponse>>> getMyFilesByUsage(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam("usage") String usage) {

        EFileUsage fileUsage = parseUsage(usage);
        List<FileUploadResponse> response = fileUploadService.getFilesByUserAndUsage(
                userDetails.getId(), fileUsage);

        return ResponseEntity.ok(ApiResponse.success("Thành công", response));
    }

    @GetMapping("/by-reference")
    public ResponseEntity<ApiResponse<List<FileUploadResponse>>> getFilesByReference(
            @RequestParam("referenceType") String referenceType,
            @RequestParam("referenceId") Long referenceId) {

        List<FileUploadResponse> response = fileUploadService.getFilesByReference(
                referenceType, referenceId);

        return ResponseEntity.ok(ApiResponse.success("Thành công", response));
    }

    @GetMapping("/user/{userId}/avatar")
    public ResponseEntity<ApiResponse<FileUploadResponse>> getUserAvatar(
            @PathVariable Long userId) {

        return fileUploadService.getCurrentAvatar(userId)
                .map(response -> ResponseEntity.ok(ApiResponse.success("Thành công", response)))
                .orElse(ResponseEntity.ok(ApiResponse.success("Không có avatar", null)));
    }

    @GetMapping("/user/{userId}/cover")
    public ResponseEntity<ApiResponse<FileUploadResponse>> getUserCover(
            @PathVariable Long userId) {

        return fileUploadService.getCurrentCover(userId)
                .map(response -> ResponseEntity.ok(ApiResponse.success("Thành công", response)))
                .orElse(ResponseEntity.ok(ApiResponse.success("Không có cover image", null)));
    }

    @GetMapping("/message/{messageId}")
    public ResponseEntity<ApiResponse<List<FileUploadResponse>>> getMessageAttachments(
            @PathVariable Long messageId) {

        List<FileUploadResponse> response = fileUploadService.getMessageAttachments(messageId);
        return ResponseEntity.ok(ApiResponse.success("Thành công", response));
    }

    @GetMapping("/dispute/{disputeId}")
    public ResponseEntity<ApiResponse<List<FileUploadResponse>>> getDisputeEvidence(
            @PathVariable Long disputeId) {

        List<FileUploadResponse> response = fileUploadService.getDisputeEvidence(disputeId);
        return ResponseEntity.ok(ApiResponse.success("Thành công", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {

        fileUploadService.deleteFile(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Xóa file thành công"));
    }

    private EFileUsage parseUsage(String usage) {
        try {
            return EFileUsage.valueOf(usage.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new FileUploadException("Usage không hợp lệ: " + usage + 
                    ". Giá trị hợp lệ: AVATAR, COVER_IMAGE, MESSAGE_IMAGE, MESSAGE_FILE, " +
                    "JOB_ATTACHMENT, APPLICATION_CV, WORK_SUBMISSION, DISPUTE_EVIDENCE, OTHER");
        }
    }
}
