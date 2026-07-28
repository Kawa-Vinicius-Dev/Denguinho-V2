package com.denguinho.controller;

import com.denguinho.dto.ChangePasswordRequest;
import com.denguinho.dto.UpdateProfileRequest;
import com.denguinho.dto.UserResponse;
import com.denguinho.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/me")
public class MeController {
    private final ProfileService profileService;

    public MeController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    UserResponse me() {
        return profileService.getCurrent();
    }

    @PatchMapping
    UserResponse update(@Valid @RequestBody UpdateProfileRequest request) {
        return profileService.update(request);
    }

    @PatchMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        profileService.changePassword(request);
    }

    @PutMapping(path = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    UserResponse updateAvatar(@RequestParam("avatar") MultipartFile avatar) {
        return profileService.updateAvatar(avatar);
    }

    @DeleteMapping("/avatar")
    UserResponse removeAvatar() {
        return profileService.removeAvatar();
    }

    @GetMapping("/avatar")
    ResponseEntity<Resource> getAvatar() {
        Resource avatar = profileService.getAvatar();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaTypeFactory.getMediaType(avatar)
                        .orElse(MediaType.APPLICATION_OCTET_STREAM))
                .body(avatar);
    }
}
