package com.denguinho.service;

import com.denguinho.dto.CreateFocusSessionRequest;
import com.denguinho.dto.FocusSessionResponse;
import com.denguinho.entity.Couple;
import com.denguinho.entity.FocusSession;
import com.denguinho.entity.User;
import com.denguinho.repository.FocusSessionRepository;
import com.denguinho.security.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;

@Service
public class FocusSessionService {
    /** Presença vale ponto: cada minuto de foco concluído soma um ponto para o casal. */
    static final int POINTS_PER_MINUTE = 1;

    private final FocusSessionRepository focusSessionRepository;
    private final CurrentUserService currentUserService;
    private final Clock clock;

    public FocusSessionService(
            FocusSessionRepository focusSessionRepository,
            CurrentUserService currentUserService,
            Clock clock
    ) {
        this.focusSessionRepository = focusSessionRepository;
        this.currentUserService = currentUserService;
        this.clock = clock;
    }

    @Transactional
    public FocusSessionResponse register(CreateFocusSessionRequest request) {
        User user = currentUserService.require();
        Couple couple = currentUserService.requireCouple(user);
        FocusSession session = focusSessionRepository.save(new FocusSession(
                couple,
                user,
                request.task().trim(),
                request.minutes(),
                request.minutes() * POINTS_PER_MINUTE,
                clock.instant()
        ));
        return new FocusSessionResponse(
                session.getId(),
                session.getTask(),
                session.getMinutes(),
                session.getPoints(),
                user.getId(),
                session.getCreatedAt()
        );
    }
}
