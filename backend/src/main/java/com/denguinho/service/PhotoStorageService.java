package com.denguinho.service;

import com.denguinho.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class PhotoStorageService {
    private static final long MAX_SIZE = 5L * 1024L * 1024L;
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );
    private final Path root;

    public PhotoStorageService(@Value("${app.storage.path}") String storagePath) {
        this.root = Path.of(storagePath).toAbsolutePath().normalize();
    }

    public String store(UUID coupleId, MultipartFile photo) {
        validate(photo);
        String extension = EXTENSIONS.get(photo.getContentType());
        String filename = coupleId + "-" + UUID.randomUUID() + extension;
        try {
            Files.createDirectories(root);
            Path destination = safeResolve(filename);
            Files.copy(photo.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (IOException exception) {
            throw new BusinessException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "PHOTO_STORAGE_ERROR",
                    "Não foi possível guardar a foto."
            );
        }
    }

    public Resource load(String filename) {
        try {
            Path file = safeResolve(filename);
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new IOException("Arquivo indisponível");
            }
            return resource;
        } catch (IOException exception) {
            throw new BusinessException(
                    HttpStatus.NOT_FOUND,
                    "PHOTO_NOT_FOUND",
                    "A foto não está disponível."
            );
        }
    }

    public void delete(String filename) {
        if (filename == null) {
            return;
        }
        try {
            Files.deleteIfExists(safeResolve(filename));
        } catch (IOException exception) {
            throw new BusinessException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "PHOTO_DELETE_ERROR",
                    "Não foi possível remover a foto."
            );
        }
    }

    private void validate(MultipartFile photo) {
        if (photo == null || photo.isEmpty()) {
            throw invalidPhoto("Escolha uma foto para enviar.");
        }
        if (photo.getSize() > MAX_SIZE) {
            throw invalidPhoto("A foto deve ter no máximo 5 MB.");
        }
        if (!EXTENSIONS.containsKey(photo.getContentType())) {
            throw invalidPhoto("Use uma imagem JPG, PNG ou WebP.");
        }
        try {
            byte[] firstBytes = photo.getInputStream().readNBytes(12);
            String signature = java.util.HexFormat.of().formatHex(firstBytes).toUpperCase();
            boolean valid = switch (photo.getContentType()) {
                case "image/jpeg" -> signature.startsWith("FFD8FF");
                case "image/png" -> signature.startsWith("89504E470D0A1A0A");
                case "image/webp" ->
                        signature.startsWith("52494646") && signature.substring(16).startsWith("57454250");
                default -> false;
            };
            if (!valid) {
                throw invalidPhoto("O conteúdo do arquivo não corresponde a uma imagem válida.");
            }
        } catch (IOException exception) {
            throw invalidPhoto("Não foi possível ler a imagem.");
        }
    }

    private Path safeResolve(String filename) throws IOException {
        Path resolved = root.resolve(filename).normalize();
        if (!resolved.startsWith(root)) {
            throw new IOException("Caminho inválido");
        }
        return resolved;
    }

    private BusinessException invalidPhoto(String message) {
        return new BusinessException(HttpStatus.BAD_REQUEST, "INVALID_PHOTO", message);
    }
}
