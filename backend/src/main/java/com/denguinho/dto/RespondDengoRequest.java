package com.denguinho.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RespondDengoRequest(
        @NotBlank @Size(max = 40) String response
) {
}
