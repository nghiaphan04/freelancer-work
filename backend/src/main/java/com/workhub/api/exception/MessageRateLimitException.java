package com.workhub.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
public class MessageRateLimitException extends RuntimeException {
    public MessageRateLimitException(String message) {
        super(message);
    }
}
