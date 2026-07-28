package com.denguinho.service;

import com.denguinho.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PhotoStorageServiceTest {
    @TempDir
    Path tempDirectory;

    @Test
    void storesAValidPngOutsideThePublicFrontend() {
        PhotoStorageService service = new PhotoStorageService(tempDirectory.toString());
        byte[] png = new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x00
        };
        var photo = new MockMultipartFile("photo", "journey.png", "image/png", png);

        String filename = service.store(UUID.randomUUID(), photo);

        assertThat(filename).endsWith(".png");
        assertThat(service.load(filename).exists()).isTrue();
    }

    @Test
    void rejectsFilesWhoseContentDoesNotMatchAnImage() {
        PhotoStorageService service = new PhotoStorageService(tempDirectory.toString());
        var fake = new MockMultipartFile(
                "photo",
                "not-really.png",
                "image/png",
                "plain text".getBytes()
        );

        assertThatThrownBy(() -> service.store(UUID.randomUUID(), fake))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("conteúdo");
    }
}

