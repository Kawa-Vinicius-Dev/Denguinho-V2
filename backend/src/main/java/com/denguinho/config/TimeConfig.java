package com.denguinho.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class TimeConfig {
    /**
     * Semanas e meses dos desafios e do placar são contados no fuso do casal,
     * não em UTC: um avanço às 22h de domingo em São Paulo ainda é da semana.
     */
    @Bean
    Clock clock(@Value("${app.time-zone:America/Sao_Paulo}") String timeZone) {
        return Clock.system(ZoneId.of(timeZone));
    }
}
