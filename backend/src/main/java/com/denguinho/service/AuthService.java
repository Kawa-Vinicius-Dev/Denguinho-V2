package com.denguinho.service;

import com.denguinho.dto.AuthResponse;
import com.denguinho.dto.LoginRequest;
import com.denguinho.dto.RegisterRequest;
import com.denguinho.entity.User;
import com.denguinho.exception.BusinessException;
import com.denguinho.mapper.UserMapper;
import com.denguinho.repository.UserRepository;
import com.denguinho.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "EMAIL_ALREADY_USED",
                    "Já existe uma conta com este e-mail."
            );
        }
        User user = userRepository.save(new User(
                request.name().trim(),
                email,
                passwordEncoder.encode(request.password())
        ));
        return new AuthResponse(jwtService.issue(user.getId()), UserMapper.toResponse(user));
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(this::invalidCredentials);
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                    user.getId().toString(),
                    request.password()
            ));
        } catch (BadCredentialsException exception) {
            throw invalidCredentials();
        }
        return new AuthResponse(jwtService.issue(user.getId()), UserMapper.toResponse(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private BusinessException invalidCredentials() {
        return new BusinessException(
                HttpStatus.UNAUTHORIZED,
                "INVALID_CREDENTIALS",
                "E-mail ou senha não conferem."
        );
    }
}

