package com.denguinho.controller;

import com.denguinho.dto.CoupleResponse;
import com.denguinho.dto.CreateInviteResponse;
import com.denguinho.dto.JoinCoupleRequest;
import com.denguinho.dto.UpdateCoupleRequest;
import com.denguinho.service.CoupleService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/couples")
public class CoupleController {
    private final CoupleService coupleService;

    public CoupleController(CoupleService coupleService) {
        this.coupleService = coupleService;
    }

    @PostMapping("/invites")
    CreateInviteResponse createInvite() {
        return coupleService.createInvite();
    }

    @PostMapping("/join")
    CoupleResponse join(@Valid @RequestBody JoinCoupleRequest request) {
        return coupleService.join(request);
    }

    @GetMapping("/me")
    CoupleResponse getCurrent() {
        return coupleService.getCurrent();
    }

    @PatchMapping("/me")
    CoupleResponse update(@Valid @RequestBody UpdateCoupleRequest request) {
        return coupleService.update(request);
    }

    @PutMapping(path = "/me/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    CoupleResponse updatePhoto(@RequestParam("photo") MultipartFile photo) {
        return coupleService.updatePhoto(photo);
    }

    @DeleteMapping("/me/photo")
    CoupleResponse removePhoto() {
        return coupleService.removePhoto();
    }

    @GetMapping("/me/photo")
    ResponseEntity<Resource> getPhoto() {
        Resource photo = coupleService.getPhoto();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaTypeFactory.getMediaType(photo)
                        .orElse(MediaType.APPLICATION_OCTET_STREAM))
                .body(photo);
    }
}
