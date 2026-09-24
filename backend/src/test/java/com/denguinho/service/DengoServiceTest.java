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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DengoServiceTest {
    private static final Instant NOW = Instant.parse("2026-09-24T15:00:00Z");

    private final DengoRepository dengoRepository = mock(DengoRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final CurrentUserService currentUserService = mock(CurrentUserService.class);
    private final DengoService service = new DengoService(
            dengoRepository,
            userRepository,
            currentUserService,
            Clock.fixed(NOW, ZoneId.of("America/Sao_Paulo"))
    );

    private final Couple couple = new Couple("Planejar a vida juntos");
    private final User lia = new User("Lia", "lia@example.com", "hash");
    private final User caio = new User("Caio", "caio@example.com", "hash");

    @BeforeEach
    void setUp() {
        lia.setCouple(couple);
        caio.setCouple(couple);
        authenticate(lia);
        when(userRepository.countByCoupleId(couple.getId())).thenReturn(2L);
        when(dengoRepository.save(any(Dengo.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void sendsARequestToThePartner() {
        DengoResponse response = service.send(new CreateDengoRequest(DengoKind.REQUEST, " Um cheiro ", " "));

        assertThat(response.message()).isEqualTo("Um cheiro");
        assertThat(response.subject()).isNull();
        assertThat(response.senderId()).isEqualTo(lia.getId());
        assertThat(response.createdAt()).isEqualTo(NOW);
    }

    @Test
    void cannotSendADengoBeforeThePartnerJoins() {
        when(userRepository.countByCoupleId(couple.getId())).thenReturn(1L);

        assertBusinessError(
                () -> service.send(new CreateDengoRequest(DengoKind.REQUEST, "Um cheiro", null)),
                HttpStatus.CONFLICT,
                "PARTNER_REQUIRED"
        );
        verify(dengoRepository, never()).save(any());
    }

    @Test
    void onlyThePartnerRespondsToARequest() {
        Dengo request = stored(lia, DengoKind.REQUEST);

        assertBusinessError(
                () -> service.respond(request.getId(), new RespondDengoRequest("Tô indo")),
                HttpStatus.FORBIDDEN,
                "DENGO_OWN_REQUEST"
        );

        authenticate(caio);
        DengoResponse response = service.respond(request.getId(), new RespondDengoRequest("Tô indo"));

        assertThat(response.response()).isEqualTo("Tô indo");
        assertThat(response.respondedAt()).isEqualTo(NOW);
    }

    @Test
    void aRequestIsAnsweredOnlyOnce() {
        Dengo request = stored(lia, DengoKind.REQUEST);
        request.respond("Tô indo", NOW);
        authenticate(caio);

        assertBusinessError(
                () -> service.respond(request.getId(), new RespondDengoRequest("Me chama")),
                HttpStatus.CONFLICT,
                "DENGO_ALREADY_ANSWERED"
        );
    }

    @Test
    void cheersCannotBeAnswered() {
        Dengo cheer = stored(lia, DengoKind.CHEER);
        authenticate(caio);

        assertBusinessError(
                () -> service.respond(cheer.getId(), new RespondDengoRequest("Valeu")),
                HttpStatus.CONFLICT,
                "DENGO_NOT_RESPONDABLE"
        );
    }

    @Test
    void theSenderReactsToTheAnswerOfARequest() {
        Dengo request = stored(lia, DengoKind.REQUEST);

        assertBusinessError(
                () -> service.react(request.getId(), new ReactToDengoRequest("❤️")),
                HttpStatus.CONFLICT,
                "DENGO_NOT_ANSWERED"
        );

        request.respond("Tô indo", NOW);
        assertThat(service.react(request.getId(), new ReactToDengoRequest("❤️")).reaction()).isEqualTo("❤️");

        authenticate(caio);
        assertBusinessError(
                () -> service.react(request.getId(), new ReactToDengoRequest("😂")),
                HttpStatus.FORBIDDEN,
                "DENGO_REACTION_NOT_ALLOWED"
        );
    }

    @Test
    void theReceiverReactsToACheer() {
        Dengo cheer = stored(lia, DengoKind.CHEER);

        assertBusinessError(
                () -> service.react(cheer.getId(), new ReactToDengoRequest("💛")),
                HttpStatus.FORBIDDEN,
                "DENGO_REACTION_NOT_ALLOWED"
        );

        authenticate(caio);
        assertThat(service.react(cheer.getId(), new ReactToDengoRequest("💛")).reaction()).isEqualTo("💛");
    }

    @Test
    void dengosFromAnotherCoupleAreNotFound() {
        Dengo foreign = new Dengo(new Couple("Outro casal"), caio, DengoKind.REQUEST, "Oi", null, NOW);
        when(dengoRepository.findByIdAndCouple_Id(foreign.getId(), couple.getId())).thenReturn(Optional.empty());

        assertBusinessError(
                () -> service.respond(foreign.getId(), new RespondDengoRequest("Tô indo")),
                HttpStatus.NOT_FOUND,
                "DENGO_NOT_FOUND"
        );
    }

    private void authenticate(User user) {
        when(currentUserService.require()).thenReturn(user);
        when(currentUserService.requireCouple(user)).thenReturn(couple);
    }

    private Dengo stored(User sender, DengoKind kind) {
        Dengo dengo = new Dengo(couple, sender, kind, "Um cheiro", null, NOW.minusSeconds(60));
        when(dengoRepository.findByIdAndCouple_Id(dengo.getId(), couple.getId())).thenReturn(Optional.of(dengo));
        return dengo;
    }

    private void assertBusinessError(Runnable action, HttpStatus status, String code) {
        assertThatThrownBy(action::run)
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getStatus()).isEqualTo(status);
                    assertThat(exception.getCode()).isEqualTo(code);
                });
    }
}
