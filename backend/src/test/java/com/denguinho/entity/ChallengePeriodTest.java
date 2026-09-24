package com.denguinho.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class ChallengePeriodTest {
    @Test
    void weeksStartOnMonday() {
        assertThat(ChallengePeriod.WEEKLY.startOf(LocalDate.of(2026, 9, 24)))
                .isEqualTo(LocalDate.of(2026, 9, 21));
        assertThat(ChallengePeriod.WEEKLY.startOf(LocalDate.of(2026, 9, 21)))
                .isEqualTo(LocalDate.of(2026, 9, 21));
        assertThat(ChallengePeriod.WEEKLY.startOf(LocalDate.of(2026, 9, 27)))
                .isEqualTo(LocalDate.of(2026, 9, 21));
    }

    @Test
    void weeksCanCrossMonthsAndYears() {
        LocalDate start = ChallengePeriod.WEEKLY.startOf(LocalDate.of(2027, 1, 1));

        assertThat(start).isEqualTo(LocalDate.of(2026, 12, 28));
        assertThat(ChallengePeriod.WEEKLY.nextStart(start)).isEqualTo(LocalDate.of(2027, 1, 4));
        assertThat(ChallengePeriod.WEEKLY.previousStart(start)).isEqualTo(LocalDate.of(2026, 12, 21));
    }

    @Test
    void monthsStartOnTheFirstDay() {
        LocalDate start = ChallengePeriod.MONTHLY.startOf(LocalDate.of(2026, 2, 28));

        assertThat(start).isEqualTo(LocalDate.of(2026, 2, 1));
        assertThat(ChallengePeriod.MONTHLY.nextStart(start)).isEqualTo(LocalDate.of(2026, 3, 1));
        assertThat(ChallengePeriod.MONTHLY.previousStart(start)).isEqualTo(LocalDate.of(2026, 1, 1));
    }
}
