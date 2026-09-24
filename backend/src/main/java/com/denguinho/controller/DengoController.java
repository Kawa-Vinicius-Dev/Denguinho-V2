package com.denguinho.controller;

import com.denguinho.dto.CreateDengoRequest;
import com.denguinho.dto.DengoResponse;
import com.denguinho.dto.ReactToDengoRequest;
import com.denguinho.dto.RespondDengoRequest;
import com.denguinho.service.DengoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/couples/me/dengos")
public class DengoController {
    private final DengoService dengoService;

    public DengoController(DengoService dengoService) {
        this.dengoService = dengoService;
    }

    @GetMapping
    List<DengoResponse> listRecent() {
        return dengoService.listRecent();
    }

    @PostMapping
    ResponseEntity<DengoResponse> send(@Valid @RequestBody CreateDengoRequest request) {
        DengoResponse sent = dengoService.send(request);
        return ResponseEntity.created(ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{id}")
                        .buildAndExpand(sent.id())
                        .toUri())
                .body(sent);
    }

    @PutMapping("/{dengoId}/response")
    DengoResponse respond(@PathVariable UUID dengoId, @Valid @RequestBody RespondDengoRequest request) {
        return dengoService.respond(dengoId, request);
    }

    @PutMapping("/{dengoId}/reaction")
    DengoResponse react(@PathVariable UUID dengoId, @Valid @RequestBody ReactToDengoRequest request) {
        return dengoService.react(dengoId, request);
    }
}
