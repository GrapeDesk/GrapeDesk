package com.grapedesk.util;

import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;

public final class Time {
    private Time() {}

    public static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");

    public static YearMonth ym(Instant instant) {
        return YearMonth.from(instant.atZone(ZONE));
    }
}
