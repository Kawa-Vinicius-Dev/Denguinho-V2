package com.denguinho.service;

import com.denguinho.dto.CoupleResponse;
import com.denguinho.dto.CreateInviteResponse;
import com.denguinho.dto.JoinCoupleRequest;
import com.denguinho.dto.UpdateCoupleRequest;
import com.denguinho.entity.Couple;
import com.denguinho.entity.CoupleInvite;
import com.denguinho.entity.User;
import com.denguinho.exception.BusinessException;
import com.denguinho.mapper.UserMapper;
import com.denguinho.repository.CoupleInviteRepository;
import com.denguinho.repository.CoupleRepository;
import com.denguinho.repository.UserRepository;
import com.denguinho.security.CurrentUserService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

@Service
public class CoupleService {
    private static final char[] CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private static final String DEFAULT_OBJECTIVE = "Construir uma rotina que caiba na vida real";

    private final CoupleRepository coupleRepository;
    private final CoupleInviteRepository inviteRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final PhotoStorageService photoStorageService;
    private final SecureRandom secureRandom = new SecureRandom();

    public CoupleService(
            CoupleRepository coupleRepository,
            CoupleInviteRepository inviteRepository,
            UserRepository userRepository,
            CurrentUserService currentUserService,
            PhotoStorageService photoStorageService
    ) {
        this.coupleRepository = coupleRepository;
        this.inviteRepository = inviteRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.photoStorageService = photoStorageService;
    }

    @Transactional
    public CreateInviteResponse createInvite() {
        User user = currentUserService.require();
        Couple couple = user.getCouple();
        if (couple == null) {
            couple = coupleRepository.save(new Couple(DEFAULT_OBJECTIVE));
            user.setCouple(couple);
            userRepository.save(user);
        }
        if (userRepository.countByCoupleId(couple.getId()) >= 2) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "COUPLE_ALREADY_COMPLETE",
                    "A dupla já está completa."
            );
        }
        CoupleInvite invite = inviteRepository.save(new CoupleInvite(
                generateCode(),
                couple,
                user,
                Instant.now().plus(Duration.ofHours(48))
        ));
        return new CreateInviteResponse(invite.getCode(), invite.getExpiresAt());
    }

    @Transactional
    public CoupleResponse join(JoinCoupleRequest request) {
        User user = currentUserService.require();
        if (user.getCouple() != null) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "USER_ALREADY_PAIRED",
                    "Você já faz parte de uma dupla."
            );
        }
        CoupleInvite invite = inviteRepository
                .findByCodeIgnoreCase(request.code().trim().toUpperCase(Locale.ROOT))
                .orElseThrow(this::invalidInvite);
        Instant now = Instant.now();
        if (!invite.isAvailable(now)) {
            throw invalidInvite();
        }
        if (userRepository.countByCoupleId(invite.getCouple().getId()) >= 2) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "COUPLE_ALREADY_COMPLETE",
                    "Esta dupla já está completa."
            );
        }
        user.setCouple(invite.getCouple());
        userRepository.save(user);
        invite.markUsed(now);
        return toResponse(invite.getCouple());
    }

    @Transactional(readOnly = true)
    public CoupleResponse getCurrent() {
        return toResponse(requireCouple(currentUserService.require()));
    }

    @Transactional
    public CoupleResponse update(UpdateCoupleRequest request) {
        Couple couple = requireCouple(currentUserService.require());
        couple.setCurrentObjective(request.currentObjective().trim());
        couple.setRelationshipStartedOn(request.relationshipStartedOn());
        if (request.photoPositionX() != null) {
            couple.setPhotoPositionX(request.photoPositionX());
        }
        if (request.photoPositionY() != null) {
            couple.setPhotoPositionY(request.photoPositionY());
        }
        return toResponse(coupleRepository.save(couple));
    }

    @Transactional
    public CoupleResponse updatePhoto(MultipartFile photo) {
        Couple couple = requireCouple(currentUserService.require());
        String previous = couple.getPhotoFilename();
        String stored = photoStorageService.store(couple.getId(), photo);
        couple.setPhotoFilename(stored);
        CoupleResponse response = toResponse(coupleRepository.save(couple));
        photoStorageService.delete(previous);
        return response;
    }

    @Transactional
    public CoupleResponse removePhoto() {
        Couple couple = requireCouple(currentUserService.require());
        String previous = couple.getPhotoFilename();
        couple.setPhotoFilename(null);
        CoupleResponse response = toResponse(coupleRepository.save(couple));
        photoStorageService.delete(previous);
        return response;
    }

    @Transactional(readOnly = true)
    public Resource getPhoto() {
        Couple couple = requireCouple(currentUserService.require());
        if (couple.getPhotoFilename() == null) {
            throw new BusinessException(
                    HttpStatus.NOT_FOUND,
                    "PHOTO_NOT_CONFIGURED",
                    "A dupla ainda não escolheu uma foto."
            );
        }
        return photoStorageService.load(couple.getPhotoFilename());
    }

    private Couple requireCouple(User user) {
        if (user.getCouple() == null) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "COUPLE_REQUIRED",
                    "Crie um convite ou entre na dupla para continuar."
            );
        }
        return user.getCouple();
    }

    private CoupleResponse toResponse(Couple couple) {
        return new CoupleResponse(
                couple.getId(),
                userRepository.findAllByCoupleIdOrderByCreatedAtAsc(couple.getId())
                        .stream()
                        .map(UserMapper::toResponse)
                        .toList(),
                couple.getCurrentObjective(),
                couple.getRelationshipStartedOn(),
                couple.getPhotoPositionX(),
                couple.getPhotoPositionY(),
                couple.getPhotoFilename() != null,
                0
        );
    }

    private String generateCode() {
        String candidate;
        do {
            StringBuilder code = new StringBuilder(6);
            for (int index = 0; index < 6; index++) {
                code.append(CODE_ALPHABET[secureRandom.nextInt(CODE_ALPHABET.length)]);
            }
            candidate = code.toString();
        } while (inviteRepository.existsByCodeIgnoreCase(candidate));
        return candidate;
    }

    private BusinessException invalidInvite() {
        return new BusinessException(
                HttpStatus.NOT_FOUND,
                "INVALID_INVITE",
                "Este convite não existe, expirou ou já foi usado."
        );
    }
}
