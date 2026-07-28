package com.denguinho.service;

import com.denguinho.dto.CoupleEventResponse;
import com.denguinho.dto.CreateCoupleEventRequest;
import com.denguinho.entity.Couple;
import com.denguinho.entity.CoupleEvent;
import com.denguinho.entity.User;
import com.denguinho.exception.BusinessException;
import com.denguinho.repository.CoupleEventRepository;
import com.denguinho.security.CurrentUserService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CoupleEventService {
    private final CoupleEventRepository eventRepository;
    private final CurrentUserService currentUserService;

    public CoupleEventService(
            CoupleEventRepository eventRepository,
            CurrentUserService currentUserService
    ) {
        this.eventRepository = eventRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<CoupleEventResponse> list() {
        Couple couple = requireCouple(currentUserService.require());
        return eventRepository.findAllByCouple_IdOrderByEventDateAsc(couple.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CoupleEventResponse create(CreateCoupleEventRequest request) {
        User user = currentUserService.require();
        Couple couple = requireCouple(user);
        CoupleEvent event = eventRepository.save(new CoupleEvent(
                couple,
                request.title().trim(),
                request.eventDate(),
                request.recurrence(),
                user
        ));
        return toResponse(event);
    }

    @Transactional
    public CoupleEventResponse update(UUID eventId, CreateCoupleEventRequest request) {
        Couple couple = requireCouple(currentUserService.require());
        CoupleEvent event = requireEvent(eventId, couple);
        event.update(
                request.title().trim(),
                request.eventDate(),
                request.recurrence()
        );
        return toResponse(eventRepository.save(event));
    }

    @Transactional
    public void delete(UUID eventId) {
        Couple couple = requireCouple(currentUserService.require());
        eventRepository.delete(requireEvent(eventId, couple));
    }

    private CoupleEvent requireEvent(UUID eventId, Couple couple) {
        return eventRepository.findByIdAndCouple_Id(eventId, couple.getId())
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.NOT_FOUND,
                        "EVENT_NOT_FOUND",
                        "Este evento não foi encontrado na agenda de vocês."
                ));
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

    private CoupleEventResponse toResponse(CoupleEvent event) {
        return new CoupleEventResponse(
                event.getId(),
                event.getTitle(),
                event.getEventDate(),
                event.getRecurrence(),
                event.getCreatedBy().getId()
        );
    }
}
