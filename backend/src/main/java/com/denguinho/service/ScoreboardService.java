package com.denguinho.service;

import com.denguinho.dto.ScoreboardResponse;
import com.denguinho.entity.ChallengePeriod;
import com.denguinho.entity.ChallengeProgress;
import com.denguinho.entity.ChallengeScope;
import com.denguinho.entity.Couple;
import com.denguinho.entity.FocusSession;
import com.denguinho.entity.User;
import com.denguinho.repository.ChallengeProgressRepository;
import com.denguinho.repository.DengoRepository;
import com.denguinho.repository.FocusSessionRepository;
import com.denguinho.repository.UserRepository;
import com.denguinho.security.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ScoreboardService {
    private final ChallengeProgressRepository progressRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final DengoRepository dengoRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final Clock clock;

    public ScoreboardService(
            ChallengeProgressRepository progressRepository,
            FocusSessionRepository focusSessionRepository,
            DengoRepository dengoRepository,
            UserRepository userRepository,
            CurrentUserService currentUserService,
            Clock clock
    ) {
        this.progressRepository = progressRepository;
        this.focusSessionRepository = focusSessionRepository;
        this.dengoRepository = dengoRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ScoreboardResponse get() {
        Couple couple = currentUserService.requireCouple();
        UUID coupleId = couple.getId();
        LocalDate today = LocalDate.now(clock);
        LocalDate weekStart = ChallengePeriod.WEEKLY.startOf(today);
        LocalDate monthStart = ChallengePeriod.MONTHLY.startOf(today);
        LocalDate weekEnd = ChallengePeriod.WEEKLY.nextStart(weekStart);
        LocalDate monthEnd = ChallengePeriod.MONTHLY.nextStart(monthStart);
        Instant from = startOfDay(weekStart.isBefore(monthStart) ? weekStart : monthStart);
        Instant to = startOfDay(weekEnd.isAfter(monthEnd) ? weekEnd : monthEnd);

        List<User> members = userRepository.findAllByCoupleIdOrderByCreatedAtAsc(coupleId);
        List<ChallengeProgress> progress = progressRepository.findAllForCoupleBetween(coupleId, from, to);
        List<FocusSession> sessions = focusSessionRepository
                .findAllByCouple_IdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(coupleId, from, to);

        return new ScoreboardResponse(
                score(coupleId, weekStart, weekEnd, members, progress, sessions),
                score(coupleId, monthStart, monthEnd, members, progress, sessions),
                new ScoreboardResponse.Totals(
                        progressRepository.sumPointsByCoupleId(coupleId)
                                + focusSessionRepository.sumPointsByCoupleId(coupleId),
                        progressRepository.countByChallenge_Couple_Id(coupleId),
                        focusSessionRepository.countByCouple_Id(coupleId),
                        dengoRepository.countByCouple_Id(coupleId)
                )
        );
    }

    private ScoreboardResponse.PeriodScore score(
            UUID coupleId,
            LocalDate start,
            LocalDate end,
            List<User> members,
            List<ChallengeProgress> allProgress,
            List<FocusSession> allSessions
    ) {
        Instant from = startOfDay(start);
        Instant to = startOfDay(end);
        List<ChallengeProgress> progress = allProgress.stream()
                .filter(item -> isBetween(item.getCreatedAt(), from, to))
                .toList();
        List<FocusSession> sessions = allSessions.stream()
                .filter(item -> isBetween(item.getCreatedAt(), from, to))
                .toList();

        List<ScoreboardResponse.MemberScore> memberScores = members.stream()
                .map(member -> {
                    List<ChallengeProgress> individual = progress.stream()
                            .filter(item -> item.getChallenge().getScope() == ChallengeScope.INDIVIDUAL)
                            .filter(item -> item.getUser().getId().equals(member.getId()))
                            .toList();
                    return new ScoreboardResponse.MemberScore(
                            member.getId(),
                            member.getName(),
                            individual.stream().mapToInt(ChallengeProgress::getPoints).sum(),
                            individual.size()
                    );
                })
                .toList();
        int couplePoints = progress.stream()
                .filter(item -> item.getChallenge().getScope() == ChallengeScope.COUPLE)
                .mapToInt(ChallengeProgress::getPoints)
                .sum()
                + sessions.stream().mapToInt(FocusSession::getPoints).sum();

        return new ScoreboardResponse.PeriodScore(
                start,
                end.minusDays(1),
                memberScores,
                couplePoints,
                progress.size(),
                sessions.size(),
                sessions.stream().mapToInt(FocusSession::getMinutes).sum(),
                (int) dengoRepository.countByCouple_IdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        coupleId,
                        from,
                        to
                )
        );
    }

    private boolean isBetween(Instant instant, Instant from, Instant to) {
        return !instant.isBefore(from) && instant.isBefore(to);
    }

    private Instant startOfDay(LocalDate date) {
        return date.atStartOfDay(clock.getZone()).toInstant();
    }
}
