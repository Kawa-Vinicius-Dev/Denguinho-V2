package com.denguinho.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReactToDengoRequest(
        @NotBlank @Size(max = 16) String reaction
) {
}
