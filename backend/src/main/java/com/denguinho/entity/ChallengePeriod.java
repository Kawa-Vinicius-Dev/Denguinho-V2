package com.denguinho.entity;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

/**
 * Períodos válidos de um desafio. O produto não tem desafios diários: o
 * progresso de um desafio recomeça a cada semana (segunda a domingo) ou mês.
 */
public enum ChallengePeriod {
    WEEKLY {
        @Override
        public LocalDate startOf(LocalDate date) {
            return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        }

        @Override
        public LocalDate nextStart(LocalDate periodStart) {
            return periodStart.plusWeeks(1);
        }

        @Override
        public LocalDate previousStart(LocalDate periodStart) {
            return periodStart.minusWeeks(1);
        }
    },
    MONTHLY {
        @Override
        public LocalDate startOf(LocalDate date) {
            return date.withDayOfMonth(1);
        }

        @Override
        public LocalDate nextStart(LocalDate periodStart) {
            return periodStart.plusMonths(1);
        }

        @Override
        public LocalDate previousStart(LocalDate periodStart) {
            return periodStart.minusMonths(1);
        }
    };

    public abstract LocalDate startOf(LocalDate date);

    public abstract LocalDate nextStart(LocalDate periodStart);

    public abstract LocalDate previousStart(LocalDate periodStart);
}
