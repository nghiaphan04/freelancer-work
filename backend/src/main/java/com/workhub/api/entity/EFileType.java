package com.workhub.api.entity;

/**
 * Loại file được upload
 */
public enum EFileType {
    IMAGE,      // Ảnh (jpg, png, gif, webp) - max 200KB
    DOCUMENT    // Tài liệu (pdf) - max 5MB
}
