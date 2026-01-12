package com.workhub.api.exception;

public class JobNotFoundException extends RuntimeException {
    
    public JobNotFoundException(String message) {
        super(message);
    }
    
    public JobNotFoundException(Long id) {
        super("Không tìm thấy job với id: " + id);
    }
}
