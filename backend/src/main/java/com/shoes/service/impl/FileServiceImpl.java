package com.shoes.service.impl;

import com.shoes.service.FileService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileServiceImpl implements FileService {

    private final String UPLOAD_DIR = "uploads";

    public FileServiceImpl() {
        File directory = new File(UPLOAD_DIR);
        if (!directory.exists()) {
            directory.mkdirs();
        }
    }

    @Override
    public String uploadFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Cannot upload empty file");
        }

        try {
            String originalFileName = file.getOriginalFilename();
            String contentType = file.getContentType();
            String baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();

            if (contentType != null && contentType.startsWith("image/") && !contentType.equals("image/svg+xml") && !contentType.equals("image/webp")) {
                // Chuyển đổi sang WebP
                String newFileName = UUID.randomUUID().toString() + ".webp";
                Path filePath = Paths.get(UPLOAD_DIR + File.separator + newFileName);
                
                com.sksamuel.scrimage.ImmutableImage.loader()
                        .fromStream(file.getInputStream())
                        .output(com.sksamuel.scrimage.webp.WebpWriter.DEFAULT.withQ(75), filePath);
                        
                return baseUrl + "/uploads/" + newFileName;
            } else {
                // Lưu file gốc
                String fileExtension = "";
                if (originalFileName != null && originalFileName.contains(".")) {
                    fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
                }

                String newFileName = UUID.randomUUID().toString() + fileExtension;
                Path filePath = Paths.get(UPLOAD_DIR + File.separator + newFileName);

                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                return baseUrl + "/uploads/" + newFileName;
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }
}
