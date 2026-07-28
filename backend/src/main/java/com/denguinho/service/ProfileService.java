package com.denguinho.service;

import com.denguinho.dto.ChangePasswordRequest;
import com.denguinho.dto.UpdateProfileRequest;
import com.denguinho.dto.UserResponse;
import com.denguinho.entity.User;
import com.denguinho.exception.BusinessException;
import com.denguinho.mapper.UserMapper;
import com.denguinho.repository.UserRepository;
import com.denguinho.security.CurrentUserService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProfileService {
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PhotoStorageService photoStorageService;

    public ProfileService(
            CurrentUserService currentUserService,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            PhotoStorageService photoStorageService
    ) {
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.photoStorageService = photoStorageService;
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrent() {
        return UserMapper.toResponse(currentUserService.require());
    }

    @Transactional
    public UserResponse update(UpdateProfileRequest request) {
        User user = currentUserService.require();
        user.setName(request.name().trim());
        return UserMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = currentUserService.require();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "CURRENT_PASSWORD_INVALID",
                    "A senha atual não confere."
            );
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserResponse updateAvatar(MultipartFile avatar) {
        User user = currentUserService.require();
        String previous = user.getAvatarFilename();
        String stored = photoStorageService.store(user.getId(), avatar);
        user.setAvatarFilename(stored);
        UserResponse response = UserMapper.toResponse(userRepository.save(user));
        photoStorageService.delete(previous);
        return response;
    }

    @Transactional
    public UserResponse removeAvatar() {
        User user = currentUserService.require();
        String previous = user.getAvatarFilename();
        user.setAvatarFilename(null);
        UserResponse response = UserMapper.toResponse(userRepository.save(user));
        photoStorageService.delete(previous);
        return response;
    }

    @Transactional(readOnly = true)
    public Resource getAvatar() {
        User user = currentUserService.require();
        if (user.getAvatarFilename() == null) {
            throw new BusinessException(
                    HttpStatus.NOT_FOUND,
                    "AVATAR_NOT_CONFIGURED",
                    "Você ainda não escolheu uma foto de perfil."
            );
        }
        return photoStorageService.load(user.getAvatarFilename());
    }
}
