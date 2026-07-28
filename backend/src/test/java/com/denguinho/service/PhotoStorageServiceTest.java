package com.denguinho.service;

import com.denguinho.exception.BusinessException;
import com.denguinho.repository.StoredPhotoRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PhotoStorageServiceTest {
    @Test
    void storesAValidPngInPrivatePersistentStorage() {
        StoredPhotoRepository repository = mock(StoredPhotoRepository.class);
        PhotoStorageService service = new PhotoStorageService(repository);
        byte[] png = new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x00
        };
        var photo = new MockMultipartFile("photo", "journey.png", "image/png", png);

        String filename = service.store(UUID.randomUUID(), photo);

        assertThat(filename).endsWith(".png");
        verify(repository).save(anyString(), any(UUID.class), anyString(), any(byte[].class));
    }

    @Test
    void loadsAStoredPhotoWithItsFilename() throws Exception {
        StoredPhotoRepository repository = mock(StoredPhotoRepository.class);
        when(repository.findByFilename("avatar.png")).thenReturn(Optional.of(
                new StoredPhotoRepository.StoredPhoto(
                        "avatar.png",
                        "image/png",
                        new byte[]{1, 2, 3}
                )
        ));
        PhotoStorageService service = new PhotoStorageService(repository);

        var resource = service.load("avatar.png");

        assertThat(resource.getFilename()).isEqualTo("avatar.png");
        assertThat(resource.getContentAsByteArray()).containsExactly(1, 2, 3);
    }

    @Test
    void rejectsFilesWhoseContentDoesNotMatchAnImage() {
        PhotoStorageService service = new PhotoStorageService(mock(StoredPhotoRepository.class));
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
