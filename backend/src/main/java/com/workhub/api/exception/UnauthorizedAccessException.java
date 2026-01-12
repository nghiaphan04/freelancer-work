package com.workhub.api.exception;

public class UnauthorizedAccessException extends RuntimeException {
    
    public UnauthorizedAccessException(String message) {
        super(message);
    }
    
    public UnauthorizedAccessException() {
        super("Bạn không có quyền thực hiện hành động này");
    }
}
