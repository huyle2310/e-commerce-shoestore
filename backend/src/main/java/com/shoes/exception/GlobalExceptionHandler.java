package com.shoes.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("message", ex.getMessage());
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, String>> handleOptimisticLocking(org.springframework.orm.ObjectOptimisticLockingFailureException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Sản phẩm đã có sự thay đổi về tồn kho trong lúc bạn đang thao tác. Vui lòng làm mới trang và thử lại.");
        return ResponseEntity.badRequest().body(response);
    }
}
