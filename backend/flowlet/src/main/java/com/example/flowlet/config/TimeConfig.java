package com.example.flowlet.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class TimeConfig {

    private static final ZoneId APP_ZONE_ID = ZoneId.of("Asia/Tokyo");

    @Bean
    public Clock appClock() {
        return Clock.system(APP_ZONE_ID);
    }
}
