package com.workhub.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class FileUploadException extends RuntimeException {

    public FileUploadException(String message) {
        super(message);
    }

    public FileUploadException(String message, Throwable cause) {
        super(message, cause);
    }

    public static FileUploadException fileTooLarge(String fileType, long maxSize) {
        String readable = maxSize < 1024 * 1024 
            ? String.format("%.0f KB", maxSize / 1024.0)
            : String.format("%.0f MB", maxSize / (1024.0 * 1024.0));
        return new FileUploadException(
            String.format("File %s vượt quá kích thước cho phép (%s)", fileType, readable));
    }

    public static FileUploadException invalidFileType(String allowedTypes) {
        return new FileUploadException(
            String.format("Loại file không được hỗ trợ. Chỉ chấp nhận: %s", allowedTypes));
    }

    public static FileUploadException uploadFailed(String reason) {
        return new FileUploadException("Upload file thất bại: " + reason);
    }

    public static FileUploadException fileNotFound() {
        return new FileUploadException("Không tìm thấy file");
    }

    public static FileUploadException accessDenied() {
        return new FileUploadException("Bạn không có quyền truy cập file này");
    }
}
