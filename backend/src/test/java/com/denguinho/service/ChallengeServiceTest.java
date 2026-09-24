package com.denguinho.service;

import com.denguinho.dto.ChallengeProgressResponse;
import com.denguinho.dto.ChallengeResponse;
import com.denguinho.dto.CreateChallengeRequest;
import com.denguinho.dto.UpdateChallengeRequest;
import com.denguinho.entity.Challenge;
import com.denguinho.entity.ChallengeCategory;
import com.denguinho.entity.ChallengePeriod;
import com.denguinho.entity.ChallengeProgress;
import com.denguinho.entity.ChallengeScope;
import com.denguinho.entity.Couple;
import com.denguinho.entity.User;
import com.denguinho.exception.BusinessException;
import com.denguinho.repository.ChallengeProgressRepository;
import com.denguinho.repository.ChallengeRepository;
import com.denguinho.security.CurrentUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ChallengeServiceTest {
    private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");
    // Quinta-feira, 24/09/2026, meio-dia em São Paulo. A semana começou na segunda, 21/09.
    private static final Instant NOW = Instant.parse("2026-09-24T15:00:00Z");
    private static final Instant LAST_MONTH = Instant.parse("2026-08-10T15:00:00Z");

    private final ChallengeRepository challengeRepository = mock(ChallengeRepository.class);
    private final ChallengeProgressRepository progressRepository = mock(ChallengeProgressRepository.class);
    private final CurrentUserService currentUserService = mock(CurrentUserService.class);
    private final ChallengeService service = new ChallengeService(
            challengeRepository,
            progressRepository,
            currentUserService,
            Clock.fixed(NOW, SAO_PAULO)
    );

    private final Couple couple = new Couple("Planejar a vida juntos");
    private final User lia = new User("Lia", "lia@example.com", "hash");
    private final User caio = new User("Caio", "caio@example.com", "hash");

    @BeforeEach
    void setUp() {
        lia.setCouple(couple);
        caio.setCouple(couple);
        authenticate(lia);
        when(challengeRepository.save(any(Challenge.class))).thenAnswer(call -> call.getArgument(0));
        when(progressRepository.save(any(ChallengeProgress.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void createsIndividualChallengeOwnedByItsCreator() {
        ChallengeResponse response = service.create(new CreateChallengeRequest(
                "  Ler 20 páginas  ",
                ChallengeCategory.STUDIES,
                ChallengePeriod.WEEKLY,
                ChallengeScope.INDIVIDUAL,
                4
        ));

        assertThat(response.title()).isEqualTo("Ler 20 páginas");
        assertThat(response.ownerId()).isEqualTo(lia.getId());
        assertThat(response.pointsPerAdvance()).isEqualTo(25);
        assertThat(response.progress()).isZero();
        assertThat(response.completed()).isFalse();
        assertThat(response.periodStartsOn()).isEqualTo(LocalDate.of(2026, 9, 21));
        assertThat(response.periodEndsOn()).isEqualTo(LocalDate.of(2026, 9, 27));
        assertThat(response.history()).isEmpty();
    }

    @Test
    void createsCoupleChallengeSharedByBothPartners() {
        ChallengeResponse response = service.create(new CreateChallengeRequest(
                "Cozinhar juntos",
                ChallengeCategory.RELATIONSHIP,
                ChallengePeriod.MONTHLY,
                ChallengeScope.COUPLE,
                3
        ));

        assertThat(response.ownerId()).isNull();
        assertThat(response.pointsPerAdvance()).isEqualTo(40);
        assertThat(response.periodStartsOn()).isEqualTo(LocalDate.of(2026, 9, 1));
        assertThat(response.periodEndsOn()).isEqualTo(LocalDate.of(2026, 9, 30));
    }

    @Test
    void rejectsNewChallengesAboveTheActiveLimit() {
        when(challengeRepository.countByCouple_IdAndArchivedAtIsNull(couple.getId()))
                .thenReturn((long) ChallengeService.MAX_ACTIVE_CHALLENGES);

        assertBusinessError(
                () -> service.create(new CreateChallengeRequest(
                        "Mais um",
                        ChallengeCategory.OTHER,
                        ChallengePeriod.WEEKLY,
                        ChallengeScope.INDIVIDUAL,
                        1
                )),
                HttpStatus.CONFLICT,
                "CHALLENGE_LIMIT_REACHED"
        );
        verify(challengeRepository, never()).save(any());
    }

    @Test
    void registersProgressUntilTheWeeklyGoal() {
        Challenge challenge = challenge(lia, ChallengePeriod.WEEKLY, ChallengeScope.INDIVIDUAL, 2);
        lockable(challenge);
        existingProgress(new ChallengeProgress(challenge, lia, Instant.parse("2026-09-22T12:00:00Z")));

        ChallengeProgressResponse response = service.registerProgress(challenge.getId());

        assertThat(response.points()).isEqualTo(25);
        assertThat(response.challenge().progress()).isEqualTo(2);
        assertThat(response.challenge().completed()).isTrue();
        assertThat(response.challenge().lastProgressId()).isEqualTo(response.id());
        verify(progressRepository).save(any(ChallengeProgress.class));
    }

    @Test
    void rejectsProgressWhenThePeriodIsAlreadyComplete() {
        Challenge challenge = challenge(lia, ChallengePeriod.WEEKLY, ChallengeScope.INDIVIDUAL, 1);
        lockable(challenge);
        existingProgress(new ChallengeProgress(challenge, lia, Instant.parse("2026-09-21T12:00:00Z")));

        assertBusinessError(
                () -> service.registerProgress(challenge.getId()),
                HttpStatus.CONFLICT,
                "CHALLENGE_PERIOD_COMPLETE"
        );
        verify(progressRepository, never()).save(any());
    }

    @Test
    void progressFromPreviousWeeksGoesToHistoryUsingTheCouplesTimeZone() {
        Challenge challenge = new Challenge(
                couple,
                lia,
                "Correr 5 km",
                ChallengeCategory.HEALTH,
                ChallengePeriod.WEEKLY,
                ChallengeScope.INDIVIDUAL,
                3,
                Instant.parse("2026-09-16T12:00:00Z")
        );
        when(challengeRepository.findAllByCouple_IdAndArchivedAtIsNullOrderByCreatedAtAsc(couple.getId()))
                .thenReturn(List.of(challenge));
        existingProgress(
                // Domingo, 20/09, 23h30 em São Paulo — já é segunda em UTC, mas pertence à semana anterior.
                new ChallengeProgress(challenge, lia, Instant.parse("2026-09-21T02:30:00Z")),
                // Segunda, 21/09, 0h30 em São Paulo.
                new ChallengeProgress(challenge, lia, Instant.parse("2026-09-21T03:30:00Z"))
        );

        ChallengeResponse response = service.list().getFirst();

        assertThat(response.progress()).isEqualTo(1);
        assertThat(response.history()).hasSize(1);
        assertThat(response.history().getFirst().startsOn()).isEqualTo(LocalDate.of(2026, 9, 14));
        assertThat(response.history().getFirst().progress()).isEqualTo(1);
        assertThat(response.history().getFirst().completed()).isFalse();
        verify(progressRepository).findAllByChallenge_IdInAndCreatedAtGreaterThanEqual(
                List.of(challenge.getId()),
                Instant.parse("2026-08-24T03:00:00Z")
        );
    }

    @Test
    void partnerCannotAdvanceAnIndividualChallenge() {
        Challenge challenge = challenge(lia, ChallengePeriod.WEEKLY, ChallengeScope.INDIVIDUAL, 3);
        lockable(challenge);
        authenticate(caio);

        assertBusinessError(
                () -> service.registerProgress(challenge.getId()),
                HttpStatus.FORBIDDEN,
                "CHALLENGE_OWNER_ONLY"
        );
    }

    @Test
    void bothPartnersAdvanceACoupleChallenge() {
        Challenge challenge = challenge(lia, ChallengePeriod.MONTHLY, ChallengeScope.COUPLE, 3);
        lockable(challenge);
        existingProgress();
        authenticate(caio);

        ChallengeProgressResponse response = service.registerProgress(challenge.getId());

        assertThat(response.points()).isEqualTo(40);
        assertThat(response.challenge().progress()).isEqualTo(1);
    }

    @Test
    void rejectsGoalBelowTheProgressAlreadyRegistered() {
        Challenge challenge = challenge(lia, ChallengePeriod.WEEKLY, ChallengeScope.INDIVIDUAL, 3);
        active(challenge);
        existingProgress(
                new ChallengeProgress(challenge, lia, Instant.parse("2026-09-21T12:00:00Z")),
                new ChallengeProgress(challenge, lia, Instant.parse("2026-09-22T12:00:00Z"))
        );

        assertBusinessError(
                () -> service.update(challenge.getId(), new UpdateChallengeRequest(
                        "Correr",
                        ChallengeCategory.HEALTH,
                        ChallengePeriod.WEEKLY,
                        1
                )),
                HttpStatus.CONFLICT,
                "GOAL_BELOW_PROGRESS"
        );
    }

    @Test
    void changingThePeriodRecountsTheCurrentProgress() {
        Challenge challenge = challenge(lia, ChallengePeriod.WEEKLY, ChallengeScope.INDIVIDUAL, 3);
        active(challenge);
        existingProgress(
                new ChallengeProgress(challenge, lia, Instant.parse("2026-09-02T12:00:00Z")),
                new ChallengeProgress(challenge, lia, Instant.parse("2026-09-22T12:00:00Z"))
        );

        ChallengeResponse response = service.update(challenge.getId(), new UpdateChallengeRequest(
                "Correr no mês",
                ChallengeCategory.HEALTH,
                ChallengePeriod.MONTHLY,
                2
        ));

        assertThat(response.period()).isEqualTo(ChallengePeriod.MONTHLY);
        assertThat(response.progress()).isEqualTo(2);
        assertThat(response.completed()).isTrue();
        assertThat(response.periodStartsOn()).isEqualTo(LocalDate.of(2026, 9, 1));
    }

    @Test
    void challengesOutsideTheCoupleAreNotFound() {
        Challenge foreign = new Challenge(
                new Couple("Outro casal"),
                caio,
                "Segredo",
                ChallengeCategory.OTHER,
                ChallengePeriod.WEEKLY,
                ChallengeScope.COUPLE,
                1,
                LAST_MONTH
        );
        when(challengeRepository.findByIdAndCouple_IdAndArchivedAtIsNull(foreign.getId(), couple.getId()))
                .thenReturn(Optional.empty());

        assertBusinessError(() -> service.delete(foreign.getId()), HttpStatus.NOT_FOUND, "CHALLENGE_NOT_FOUND");
    }

    @Test
    void deletingArchivesTheChallengeAndKeepsItsPoints() {
        Challenge challenge = challenge(lia, ChallengePeriod.WEEKLY, ChallengeScope.INDIVIDUAL, 3);
        active(challenge);

        service.delete(challenge.getId());

        assertThat(challenge.getArchivedAt()).isEqualTo(NOW);
        verify(progressRepository, never()).delete(any());
    }

    @Test
    void partnerCannotDeleteAnIndividualChallenge() {
        Challenge challenge = challenge(lia, ChallengePeriod.WEEKLY, ChallengeScope.INDIVIDUAL, 3);
        active(challenge);
        authenticate(caio);

        assertBusinessError(() -> service.delete(challenge.getId()), HttpStatus.FORBIDDEN, "CHALLENGE_OWNER_ONLY");
        assertThat(challenge.getArchivedAt()).isNull();
    }

    @Test
    void undoesOwnProgressFromTheCurrentPeriod() {
        Challenge challenge = challenge(lia, ChallengePeriod.WEEKLY, ChallengeScope.INDIVIDUAL, 3);
        lockable(challenge);
        ChallengeProgress progress = new ChallengeProgress(challenge, lia, Instant.parse("2026-09-23T12:00:00Z"));
        when(progressRepository.findByIdAndChallenge_Id(progress.getId(), challenge.getId()))
                .thenReturn(Optional.of(progress));

        service.undoProgress(challenge.getId(), progress.getId());

        verify(progressRepository).delete(progress);
    }

    @Test
    void cannotUndoProgressRegisteredByThePartner() {
        Challenge challenge = challenge(lia, ChallengePeriod.WEEKLY, ChallengeScope.COUPLE, 3);
        lockable(challenge);
        ChallengeProgress progress = new ChallengeProgress(challenge, caio, Instant.parse("2026-09-23T12:00:00Z"));
        when(progressRepository.findByIdAndChallenge_Id(progress.getId(), challenge.getId()))
                .thenReturn(Optional.of(progress));

        assertBusinessError(
                () -> service.undoProgress(challenge.getId(), progress.getId()),
                HttpStatus.FORBIDDEN,
                "PROGRESS_AUTHOR_ONLY"
        );
        verify(progressRepository, never()).delete(any());
    }

    @Test
    void cannotUndoProgressFromAClosedPeriod() {
        Challenge challenge = challenge(lia, ChallengePeriod.WEEKLY, ChallengeScope.INDIVIDUAL, 3);
        lockable(challenge);
        ChallengeProgress progress = new ChallengeProgress(challenge, lia, Instant.parse("2026-09-18T12:00:00Z"));
        when(progressRepository.findByIdAndChallenge_Id(progress.getId(), challenge.getId()))
                .thenReturn(Optional.of(progress));

        assertBusinessError(
                () -> service.undoProgress(challenge.getId(), progress.getId()),
                HttpStatus.CONFLICT,
                "PROGRESS_PERIOD_CLOSED"
        );
    }

    private void authenticate(User user) {
        when(currentUserService.require()).thenReturn(user);
        when(currentUserService.requireCouple(user)).thenReturn(couple);
    }

    private Challenge challenge(User creator, ChallengePeriod period, ChallengeScope scope, int goal) {
        return new Challenge(
                couple,
                creator,
                "Desafio",
                ChallengeCategory.OTHER,
                period,
                scope,
                goal,
                LAST_MONTH
        );
    }

    private void active(Challenge challenge) {
        when(challengeRepository.findByIdAndCouple_IdAndArchivedAtIsNull(challenge.getId(), couple.getId()))
                .thenReturn(Optional.of(challenge));
    }

    private void lockable(Challenge challenge) {
        when(challengeRepository.findActiveForUpdate(challenge.getId(), couple.getId()))
                .thenReturn(Optional.of(challenge));
    }

    private void existingProgress(ChallengeProgress... progress) {
        when(progressRepository.findAllByChallenge_IdInAndCreatedAtGreaterThanEqual(anyCollection(), any()))
                .thenReturn(List.of(progress));
    }

    private void assertBusinessError(Runnable action, HttpStatus status, String code) {
        assertThatThrownBy(action::run)
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getStatus()).isEqualTo(status);
                    assertThat(exception.getCode()).isEqualTo(code);
                });
    }
}
