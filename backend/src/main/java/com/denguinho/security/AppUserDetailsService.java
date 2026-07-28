package com.denguinho.security;

import com.denguinho.entity.User;
import com.denguinho.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AppUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    public AppUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        User user;
        try {
            user = userRepository.findById(UUID.fromString(username))
                    .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
        } catch (IllegalArgumentException exception) {
            throw new UsernameNotFoundException("Identificador inválido");
        }
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getId().toString())
                .password(user.getPasswordHash())
                .authorities("ROLE_USER")
                .build();
    }
}

