package com.denguinho.service;

import com.denguinho.dto.CreateDengoRequest;
import com.denguinho.dto.DengoResponse;
import com.denguinho.dto.ReactToDengoRequest;
import com.denguinho.dto.RespondDengoRequest;
import com.denguinho.entity.Couple;
import com.denguinho.entity.Dengo;
import com.denguinho.entity.DengoKind;
import com.denguinho.entity.User;
import com.denguinho.exception.BusinessException;
import com.denguinho.repository.DengoRepository;
import com.denguinho.repository.UserRepository;
import com.denguinho.security.CurrentUserService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

@Service
public class DengoService {
    private final DengoRepository dengoRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final Clock clock;

    public DengoService(
            DengoRepository dengoRepository,
            UserRepository userRepository,
            CurrentUserService currentUserService,
            Clock clock
    ) {
        this.dengoRepository = dengoRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<DengoResponse> listRecent() {
        Couple couple = currentUserService.requireCouple();
        return dengoRepository.findTop30ByCouple_IdOrderByCreatedAtDesc(couple.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public DengoResponse send(CreateDengoRequest request) {
        User user = currentUserService.require();
        Couple couple = currentUserService.requireCouple(user);
        if (userRepository.countByCoupleId(couple.getId()) < 2) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "PARTNER_REQUIRED",
                    "Seu dengo ainda não entrou na dupla."
            );
        }
        String subject = request.subject() == null || request.subject().isBlank()
                ? null
                : request.subject().trim();
        Dengo dengo = dengoRepository.save(new Dengo(
                couple,
                user,
                request.kind(),
                request.message().trim(),
                subject,
                clock.instant()
        ));
        return toResponse(dengo);
    }

    @Transactional
    public DengoResponse respond(UUID dengoId, RespondDengoRequest request) {
        User user = currentUserService.require();
        Dengo dengo = requireDengo(dengoId, currentUserService.requireCouple(user));
        if (dengo.getKind() != DengoKind.REQUEST) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "DENGO_NOT_RESPONDABLE",
                    "Só pedidos de dengo podem ser respondidos."
            );
        }
        if (dengo.isSentBy(user)) {
            throw new BusinessException(
                    HttpStatus.FORBIDDEN,
                    "DENGO_OWN_REQUEST",
                    "Quem responde esse pedido é o seu dengo."
            );
        }
        if (dengo.getResponse() != null) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "DENGO_ALREADY_ANSWERED",
                    "Esse dengo já foi respondido."
            );
        }
        dengo.respond(request.response().trim(), clock.instant());
        return toResponse(dengoRepository.save(dengo));
    }

    @Transactional
    public DengoResponse react(UUID dengoId, ReactToDengoRequest request) {
        User user = currentUserService.require();
        Dengo dengo = requireDengo(dengoId, currentUserService.requireCouple(user));
        if (dengo.getKind() == DengoKind.REQUEST) {
            if (!dengo.isSentBy(user)) {
                throw new BusinessException(
                        HttpStatus.FORBIDDEN,
                        "DENGO_REACTION_NOT_ALLOWED",
                        "Quem pediu o dengo é quem reage à resposta."
                );
            }
            if (dengo.getResponse() == null) {
                throw new BusinessException(
                        HttpStatus.CONFLICT,
                        "DENGO_NOT_ANSWERED",
                        "Espere a resposta do seu dengo para reagir."
                );
            }
        } else if (dengo.isSentBy(user)) {
            throw new BusinessException(
                    HttpStatus.FORBIDDEN,
                    "DENGO_REACTION_NOT_ALLOWED",
                    "Quem recebeu a energia é quem reage a ela."
            );
        }
        dengo.react(request.reaction().trim());
        return toResponse(dengoRepository.save(dengo));
    }

    private Dengo requireDengo(UUID dengoId, Couple couple) {
        return dengoRepository.findByIdAndCouple_Id(dengoId, couple.getId())
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.NOT_FOUND,
                        "DENGO_NOT_FOUND",
                        "Este dengo não foi encontrado."
                ));
    }

    private DengoResponse toResponse(Dengo dengo) {
        return new DengoResponse(
                dengo.getId(),
                dengo.getKind(),
                dengo.getMessage(),
                dengo.getSubject(),
                dengo.getSender().getId(),
                dengo.getResponse(),
                dengo.getRespondedAt(),
                dengo.getReaction(),
                dengo.getCreatedAt()
        );
    }
}
