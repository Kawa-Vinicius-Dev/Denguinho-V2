package com.denguinho.service;

import com.denguinho.dto.ChallengeProgressResponse;
import com.denguinho.dto.ChallengeResponse;
import com.denguinho.dto.CreateChallengeRequest;
import com.denguinho.dto.UpdateChallengeRequest;
import com.denguinho.entity.Challenge;
import com.denguinho.entity.ChallengePeriod;
import com.denguinho.entity.ChallengeProgress;
import com.denguinho.entity.Couple;
import com.denguinho.entity.User;
import com.denguinho.exception.BusinessException;
import com.denguinho.repository.ChallengeProgressRepository;
import com.denguinho.repository.ChallengeRepository;
import com.denguinho.security.CurrentUserService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ChallengeService {
    static final int MAX_ACTIVE_CHALLENGES = 30;
    static final int HISTORY_PERIODS = 4;

    private final ChallengeRepository challengeRepository;
    private final ChallengeProgressRepository progressRepository;
    private final CurrentUserService currentUserService;
    private final Clock clock;

    public ChallengeService(
            ChallengeRepository challengeRepository,
            ChallengeProgressRepository progressRepository,
            CurrentUserService currentUserService,
            Clock clock
    ) {
        this.challengeRepository = challengeRepository;
        this.progressRepository = progressRepository;
        this.currentUserService = currentUserService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<ChallengeResponse> list() {
        User user = currentUserService.require();
        Couple couple = currentUserService.requireCouple(user);
        List<Challenge> challenges = challengeRepository
                .findAllByCouple_IdAndArchivedAtIsNullOrderByCreatedAtAsc(couple.getId());
        if (challenges.isEmpty()) {
            return List.of();
        }
        LocalDate today = LocalDate.now(clock);
        LocalDate since = challenges.stream()
                .map(challenge -> historyStart(challenge.getPeriod(), today))
                .min(Comparator.naturalOrder())
                .orElse(today);
        Map<UUID, List<ChallengeProgress>> progressByChallenge = progressRepository
                .findAllByChallenge_IdInAndCreatedAtGreaterThanEqual(
                        challenges.stream().map(Challenge::getId).toList(),
                        startOfDay(since)
                )
                .stream()
                .collect(Collectors.groupingBy(progress -> progress.getChallenge().getId()));
        return challenges.stream()
                .map(challenge -> toResponse(
                        challenge,
                        progressByChallenge.getOrDefault(challenge.getId(), List.of()),
                        user,
                        today
                ))
                .toList();
    }

    @Transactional
    public ChallengeResponse create(CreateChallengeRequest request) {
        User user = currentUserService.require();
        Couple couple = currentUserService.requireCouple(user);
        if (challengeRepository.countByCouple_IdAndArchivedAtIsNull(couple.getId()) >= MAX_ACTIVE_CHALLENGES) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "CHALLENGE_LIMIT_REACHED",
                    "Vocês já têm %d desafios ativos. Conclua ou exclua algum para criar outro."
                            .formatted(MAX_ACTIVE_CHALLENGES)
            );
        }
        Challenge challenge = challengeRepository.save(new Challenge(
                couple,
                user,
                request.title().trim(),
                request.category(),
                request.period(),
                request.scope(),
                request.goal(),
                clock.instant()
        ));
        return toResponse(challenge, List.of(), user, LocalDate.now(clock));
    }

    @Transactional
    public ChallengeResponse update(UUID challengeId, UpdateChallengeRequest request) {
        User user = currentUserService.require();
        Challenge challenge = requireActive(challengeId, currentUserService.requireCouple(user));
        requireBelongsTo(challenge, user);
        LocalDate today = LocalDate.now(clock);
        List<ChallengeProgress> progress = progressSince(challenge, historyStart(request.period(), today));
        int currentProgress = countInPeriod(progress, request.period(), request.period().startOf(today));
        if (request.goal() < currentProgress) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "GOAL_BELOW_PROGRESS",
                    "A meta não pode ficar abaixo dos %d avanços já registrados neste período."
                            .formatted(currentProgress)
            );
        }
        challenge.update(request.title().trim(), request.category(), request.period(), request.goal());
        return toResponse(challengeRepository.save(challenge), progress, user, today);
    }

    @Transactional
    public void delete(UUID challengeId) {
        User user = currentUserService.require();
        Challenge challenge = requireActive(challengeId, currentUserService.requireCouple(user));
        requireBelongsTo(challenge, user);
        challenge.archive(clock.instant());
        challengeRepository.save(challenge);
    }

    @Transactional
    public ChallengeProgressResponse registerProgress(UUID challengeId) {
        User user = currentUserService.require();
        Couple couple = currentUserService.requireCouple(user);
        Challenge challenge = challengeRepository.findActiveForUpdate(challengeId, couple.getId())
                .orElseThrow(this::challengeNotFound);
        requireBelongsTo(challenge, user);
        LocalDate today = LocalDate.now(clock);
        ChallengePeriod period = challenge.getPeriod();
        List<ChallengeProgress> progress = new ArrayList<>(
                progressSince(challenge, historyStart(period, today))
        );
        if (countInPeriod(progress, period, period.startOf(today)) >= challenge.getGoal()) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "CHALLENGE_PERIOD_COMPLETE",
                    period == ChallengePeriod.WEEKLY
                            ? "Esse desafio já foi concluído nesta semana. Ele recomeça na segunda-feira."
                            : "Esse desafio já foi concluído neste mês. Ele recomeça no dia 1º."
            );
        }
        ChallengeProgress saved = progressRepository.save(
                new ChallengeProgress(challenge, user, clock.instant())
        );
        progress.add(saved);
        return new ChallengeProgressResponse(
                saved.getId(),
                saved.getPoints(),
                toResponse(challenge, progress, user, today)
        );
    }

    @Transactional
    public void undoProgress(UUID challengeId, UUID progressId) {
        User user = currentUserService.require();
        Couple couple = currentUserService.requireCouple(user);
        Challenge challenge = challengeRepository.findActiveForUpdate(challengeId, couple.getId())
                .orElseThrow(this::challengeNotFound);
        ChallengeProgress progress = progressRepository.findByIdAndChallenge_Id(progressId, challenge.getId())
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.NOT_FOUND,
                        "PROGRESS_NOT_FOUND",
                        "Este avanço não foi encontrado."
                ));
        if (!progress.getUser().getId().equals(user.getId())) {
            throw new BusinessException(
                    HttpStatus.FORBIDDEN,
                    "PROGRESS_AUTHOR_ONLY",
                    "Só quem registrou este avanço pode desfazê-lo."
            );
        }
        LocalDate currentStart = challenge.getPeriod().startOf(LocalDate.now(clock));
        if (localDate(progress.getCreatedAt()).isBefore(currentStart)) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "PROGRESS_PERIOD_CLOSED",
                    "Só dá para desfazer avanços do período atual."
            );
        }
        progressRepository.delete(progress);
    }

    private ChallengeResponse toResponse(
            Challenge challenge,
            List<ChallengeProgress> progress,
            User user,
            LocalDate today
    ) {
        ChallengePeriod period = challenge.getPeriod();
        LocalDate currentStart = period.startOf(today);
        List<ChallengeProgress> current = inPeriod(progress, period, currentStart);
        UUID lastProgressId = current.stream()
                .filter(item -> item.getUser().getId().equals(user.getId()))
                .max(Comparator.comparing(ChallengeProgress::getCreatedAt))
                .map(ChallengeProgress::getId)
                .orElse(null);
        return new ChallengeResponse(
                challenge.getId(),
                challenge.getTitle(),
                challenge.getCategory(),
                period,
                challenge.getScope(),
                challenge.getOwner() == null ? null : challenge.getOwner().getId(),
                challenge.getGoal(),
                challenge.getPointsPerAdvance(),
                current.size(),
                current.size() >= challenge.getGoal(),
                currentStart,
                period.nextStart(currentStart).minusDays(1),
                lastProgressId,
                history(challenge, progress, currentStart),
                challenge.getCreatedBy().getId(),
                challenge.getCreatedAt()
        );
    }

    private List<ChallengeResponse.PeriodResult> history(
            Challenge challenge,
            List<ChallengeProgress> progress,
            LocalDate currentStart
    ) {
        ChallengePeriod period = challenge.getPeriod();
        LocalDate createdOn = localDate(challenge.getCreatedAt());
        List<ChallengeResponse.PeriodResult> history = new ArrayList<>();
        LocalDate start = period.previousStart(currentStart);
        for (int index = 0; index < HISTORY_PERIODS; index++) {
            LocalDate next = period.nextStart(start);
            if (!next.isAfter(createdOn)) {
                break;
            }
            int count = countInPeriod(progress, period, start);
            history.add(new ChallengeResponse.PeriodResult(
                    start,
                    next.minusDays(1),
                    count,
                    count >= challenge.getGoal()
            ));
            start = period.previousStart(start);
        }
        return history;
    }

    private List<ChallengeProgress> progressSince(Challenge challenge, LocalDate since) {
        return progressRepository.findAllByChallenge_IdInAndCreatedAtGreaterThanEqual(
                List.of(challenge.getId()),
                startOfDay(since)
        );
    }

    private List<ChallengeProgress> inPeriod(
            List<ChallengeProgress> progress,
            ChallengePeriod period,
            LocalDate periodStart
    ) {
        LocalDate next = period.nextStart(periodStart);
        return progress.stream()
                .filter(item -> {
                    LocalDate date = localDate(item.getCreatedAt());
                    return !date.isBefore(periodStart) && date.isBefore(next);
                })
                .toList();
    }

    private int countInPeriod(List<ChallengeProgress> progress, ChallengePeriod period, LocalDate periodStart) {
        return inPeriod(progress, period, periodStart).size();
    }

    private LocalDate historyStart(ChallengePeriod period, LocalDate today) {
        LocalDate start = period.startOf(today);
        for (int index = 0; index < HISTORY_PERIODS; index++) {
            start = period.previousStart(start);
        }
        return start;
    }

    private Challenge requireActive(UUID challengeId, Couple couple) {
        return challengeRepository.findByIdAndCouple_IdAndArchivedAtIsNull(challengeId, couple.getId())
                .orElseThrow(this::challengeNotFound);
    }

    private void requireBelongsTo(Challenge challenge, User user) {
        if (!challenge.belongsTo(user)) {
            throw new BusinessException(
                    HttpStatus.FORBIDDEN,
                    "CHALLENGE_OWNER_ONLY",
                    "Este é um desafio individual do seu dengo. Só quem o criou pode alterá-lo ou registrar avanços."
            );
        }
    }

    private Instant startOfDay(LocalDate date) {
        return date.atStartOfDay(clock.getZone()).toInstant();
    }

    private LocalDate localDate(Instant instant) {
        return LocalDate.ofInstant(instant, clock.getZone());
    }

    private BusinessException challengeNotFound() {
        return new BusinessException(
                HttpStatus.NOT_FOUND,
                "CHALLENGE_NOT_FOUND",
                "Este desafio não foi encontrado."
        );
    }
}
