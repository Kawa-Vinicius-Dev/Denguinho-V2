package com.denguinho.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    ResponseEntity<ApiError> handleBusiness(BusinessException exception) {
        return ResponseEntity.status(exception.getStatus()).body(new ApiError(
                Instant.now(),
                exception.getStatus().value(),
                exception.getCode(),
                exception.getMessage(),
                Map.of()
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new ApiError(
                Instant.now(),
                400,
                "VALIDATION_ERROR",
                "Revise os campos informados.",
                fields
        ));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ApiError> handleMaxUpload(MaxUploadSizeExceededException exception) {
        return ResponseEntity.badRequest().body(new ApiError(
                Instant.now(),
                400,
                "PHOTO_TOO_LARGE",
                "A foto deve ter no máximo 5 MB.",
                Map.of()
        ));
    }
}

