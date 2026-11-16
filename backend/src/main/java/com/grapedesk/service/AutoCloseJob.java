package com.grapedesk.service;

import com.grapedesk.domain.TicketStatus;
import com.grapedesk.repository.TicketRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/** Encerra automaticamente chamados concluídos e inativos (configuração "Encerramento automático"). */
@Component
public class AutoCloseJob {
    private final TicketRepository tickets;
    private final SettingsService settings;

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void closeInactive() {
        int days = settings.autoCloseDays();
        if (days <= 0) return;
        Instant limit = Instant.now().minus(days, ChronoUnit.DAYS);
        tickets.findByStatusAndUpdatedAtBefore(TicketStatus.RESOLVED, limit)
                .forEach(t -> t.setStatus(TicketStatus.CLOSED));
    }

    public AutoCloseJob(TicketRepository tickets, SettingsService settings) {
        this.tickets = tickets;
        this.settings = settings;
    }
}
