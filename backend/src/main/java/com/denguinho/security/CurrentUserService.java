package com.denguinho.security;

import com.denguinho.entity.Couple;
import com.denguinho.entity.User;
import com.denguinho.exception.BusinessException;
import com.denguinho.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CurrentUserService {
    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User require() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Faça login para continuar.");
        }
        return userRepository.findById(UUID.fromString(authentication.getName()))
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.UNAUTHORIZED,
                        "USER_NOT_FOUND",
                        "A sessão não pertence a um usuário ativo."
                ));
    }

    public Couple requireCouple() {
        return requireCouple(require());
    }

    public Couple requireCouple(User user) {
        if (user.getCouple() == null) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "COUPLE_REQUIRED",
                    "Crie um convite ou entre na dupla para continuar."
            );
        }
        return user.getCouple();
    }
}
