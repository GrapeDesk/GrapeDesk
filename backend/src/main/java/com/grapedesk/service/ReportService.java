package com.grapedesk.service;

import com.grapedesk.domain.*;
import com.grapedesk.dto.Dtos.*;
import com.grapedesk.repository.TicketRepository;
import com.grapedesk.repository.UserRepository;
import com.grapedesk.util.Time;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.YearMonth;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/** Indicadores da tela de Relatórios, calculados a partir dos chamados cadastrados. */
@Service
@Transactional(readOnly = true)
public class ReportService {
    private static final String[] MONTHS = {"Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"};

    private final TicketRepository tickets;
    private final UserRepository users;

    public ReportSummary summary() {
        List<Ticket> all = tickets.findAll();
        YearMonth cur = YearMonth.now(Time.ZONE);
        YearMonth prev = cur.minusMonths(1);
        YearMonth first = cur.minusMonths(5);

        // chamados por mês (últimos 6 meses)
        List<Monthly> monthly = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth m = cur.minusMonths(i);
            long n = all.stream().filter(t -> Time.ym(t.getCreatedAt()).equals(m)).count();
            monthly.add(new Monthly(label(m), n));
        }

        // demais indicadores usam a mesma janela de 6 meses
        List<Ticket> window = all.stream().filter(t -> !Time.ym(t.getCreatedAt()).isBefore(first)).toList();

        List<PriorityCount> priority = new ArrayList<>();
        for (TicketPriority p : List.of(TicketPriority.CRITICAL, TicketPriority.HIGH, TicketPriority.MEDIUM, TicketPriority.LOW)) {
            long n = window.stream().filter(t -> t.getPriority() == p).count();
            if (n > 0 || p != TicketPriority.CRITICAL) priority.add(new PriorityCount(p, n));
        }

        List<SectorCount> sectors = window.stream()
                .collect(Collectors.groupingBy(t -> t.getSector() == null || t.getSector().isBlank() ? "Não informado" : t.getSector(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> new SectorCount(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(SectorCount::count).reversed())
                .toList();

        TimeAvg avgResponse = timeAvg(all, window, Ticket::getFirstResponseAt, cur, prev);
        TimeAvg avgResolution = timeAvg(all, window, Ticket::getClosedAt, cur, prev);

        return new ReportSummary(window.size(), monthly, priority, sectors, avgResponse, avgResolution,
                technicians(all), satisfaction(all), insights(all, cur, prev, avgResolution));
    }

    // ---------- técnicos
    private List<TechPerformance> technicians(List<Ticket> all) {
        List<TechPerformance> result = new ArrayList<>();
        for (User u : users.findByRoleInAndActiveTrueOrderByNameAsc(Set.of(Role.TECHNICIAN, Role.ADMIN))) {
            List<Ticket> mine = all.stream()
                    .filter(t -> t.getAssignee() != null && t.getAssignee().getId().equals(u.getId()))
                    .toList();
            long resolved = mine.stream().filter(t -> t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED).count();
            long inProgress = mine.stream().filter(t -> t.getStatus() == TicketStatus.IN_PROGRESS).count();
            OptionalDouble tmr = avgMinutes(mine.stream(), Ticket::getClosedAt);
            double rating = mine.stream().filter(t -> t.getRating() != null).mapToInt(Ticket::getRating).average().orElse(0);
            result.add(new TechPerformance(u.getId(), u.getName(), resolved, inProgress,
                    tmr.isPresent() ? format(tmr.getAsDouble()) : "—", Math.round(rating * 10) / 10.0));
        }
        return result;
    }

    // ---------- satisfação
    private Satisfaction satisfaction(List<Ticket> all) {
        List<Integer> ratings = all.stream().map(Ticket::getRating).filter(Objects::nonNull).toList();
        if (ratings.isEmpty()) return new Satisfaction(0, 0);
        double avg = ratings.stream().mapToInt(Integer::intValue).average().orElse(0);
        long positive = ratings.stream().filter(r -> r >= 4).count();
        return new Satisfaction(Math.round(avg * 10) / 10.0, (int) Math.round(positive * 100.0 / ratings.size()));
    }

    // ---------- tempos médios
    private TimeAvg timeAvg(List<Ticket> all, List<Ticket> window, Function<Ticket, Instant> end, YearMonth cur, YearMonth prev) {
        OptionalDouble c = avgMinutes(all.stream().filter(t -> Time.ym(t.getCreatedAt()).equals(cur)), end);
        OptionalDouble p = avgMinutes(all.stream().filter(t -> Time.ym(t.getCreatedAt()).equals(prev)), end);
        OptionalDouble shown = c.isPresent() ? c : avgMinutes(window.stream(), end);
        int delta = 0;
        if (c.isPresent() && p.isPresent() && p.getAsDouble() > 0) {
            delta = (int) Math.round((c.getAsDouble() - p.getAsDouble()) * 100.0 / p.getAsDouble());
        }
        return new TimeAvg(shown.isPresent() ? format(shown.getAsDouble()) : "—", delta);
    }

    private static OptionalDouble avgMinutes(Stream<Ticket> stream, Function<Ticket, Instant> end) {
        return stream.filter(t -> end.apply(t) != null)
                .mapToLong(t -> Duration.between(t.getCreatedAt(), end.apply(t)).toMinutes())
                .average();
    }

    /** 15 -> "15 min"; 80 -> "1h 20min"; 120 -> "2h". */
    static String format(double minutes) {
        long m = Math.max(0, Math.round(minutes));
        if (m < 60) return m + " min";
        long h = m / 60;
        long rest = m % 60;
        return rest == 0 ? h + "h" : h + "h " + rest + "min";
    }

    // ---------- resumo rápido
    private List<Insight> insights(List<Ticket> all, YearMonth cur, YearMonth prev, TimeAvg avgResolution) {
        List<Insight> list = new ArrayList<>();
        Map<String, Long> catCur = countBy(all, cur, t -> t.getCategory().getName());
        Map<String, Long> catPrev = countBy(all, prev, t -> t.getCategory().getName());

        catCur.entrySet().stream()
                .filter(e -> catPrev.getOrDefault(e.getKey(), 0L) > 0 && e.getValue() > catPrev.get(e.getKey()))
                .max(Comparator.comparingDouble((Map.Entry<String, Long> e) -> growth(e.getValue(), catPrev.get(e.getKey()))))
                .ifPresent(e -> list.add(new Insight(iconFor(e.getKey()),
                        "Chamados de " + e.getKey() + " aumentaram " + Math.round(growth(e.getValue(), catPrev.get(e.getKey())))
                                + "% em relação ao mês anterior.")));

        countBy(all, cur, t -> t.getSector() == null || t.getSector().isBlank() ? "Não informado" : t.getSector())
                .entrySet().stream().max(Map.Entry.comparingByValue())
                .ifPresent(e -> list.add(new Insight("users", "Setor " + e.getKey() + " teve o maior volume de chamados este mês.")));

        if (avgResolution.delta() != 0) {
            list.add(new Insight("clock", "Tempo médio de resolução " + (avgResolution.delta() < 0 ? "caiu " : "aumentou ")
                    + Math.abs(avgResolution.delta()) + "% em relação ao mês anterior."));
        }

        long totalCur = catCur.values().stream().mapToLong(Long::longValue).sum();
        catCur.entrySet().stream().max(Map.Entry.comparingByValue()).ifPresent(e -> {
            if (totalCur > 0) {
                list.add(new Insight("target", "A categoria " + e.getKey() + " concentra "
                        + Math.round(e.getValue() * 100.0 / totalCur) + "% dos chamados deste mês."));
            }
        });
        return list;
    }

    private static Map<String, Long> countBy(List<Ticket> all, YearMonth month, Function<Ticket, String> key) {
        return all.stream().filter(t -> Time.ym(t.getCreatedAt()).equals(month))
                .collect(Collectors.groupingBy(key, Collectors.counting()));
    }

    private static double growth(long current, long previous) {
        return (current - previous) * 100.0 / previous;
    }

    private static String iconFor(String category) {
        return switch (category) {
            case "Impressora" -> "printer";
            case "Rede / Internet" -> "wifi";
            case "Hardware" -> "monitor";
            case "Software" -> "gear";
            case "Acesso / Senha" -> "lock";
            case "Sistemas internos" -> "server";
            default -> "tag";
        };
    }

    private static String label(YearMonth m) {
        return MONTHS[m.getMonthValue() - 1] + "/" + String.valueOf(m.getYear()).substring(2);
    }

    public ReportService(TicketRepository tickets, UserRepository users) {
        this.tickets = tickets;
        this.users = users;
    }
}
