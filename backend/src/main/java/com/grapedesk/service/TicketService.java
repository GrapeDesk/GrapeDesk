package com.grapedesk.service;

import com.grapedesk.domain.*;
import com.grapedesk.dto.Dtos.*;
import com.grapedesk.repository.CategoryRepository;
import com.grapedesk.repository.TicketRepository;
import com.grapedesk.repository.UserRepository;
import com.grapedesk.util.Time;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TicketService {
    private final TicketRepository tickets;
    private final CategoryRepository categories;
    private final UserRepository users;
    private final SettingsService settings;

    private static boolean isStaff(User u) { return u.getRole() != Role.USER; }

    @Transactional(readOnly = true)
    public List<TicketResponse> list(User current, TicketStatus status, String q) {
        return find(current, status, q).stream().map(t -> TicketResponse.of(t, false)).toList();
    }

    @Transactional(readOnly = true)
    public StatsResponse stats(User current) {
        List<Ticket> all = find(current, null, null);
        long open = count(all, TicketStatus.OPEN);
        long prog = count(all, TicketStatus.IN_PROGRESS);
        long wait = count(all, TicketStatus.WAITING);
        long res = count(all, TicketStatus.RESOLVED);
        long closed = count(all, TicketStatus.CLOSED);

        YearMonth cur = YearMonth.now(Time.ZONE);
        YearMonth prev = cur.minusMonths(1);
        return new StatsResponse(all.size(), open, prog, wait, res, closed,
                delta(createdIn(all, cur, null), createdIn(all, prev, null)),
                delta(createdIn(all, cur, TicketStatus.IN_PROGRESS), createdIn(all, prev, TicketStatus.IN_PROGRESS)),
                delta(createdIn(all, cur, TicketStatus.RESOLVED), createdIn(all, prev, TicketStatus.RESOLVED)),
                delta(createdIn(all, cur, TicketStatus.WAITING), createdIn(all, prev, TicketStatus.WAITING)));
    }

    @Transactional(readOnly = true)
    public TicketResponse get(User current, Long id) {
        return TicketResponse.of(load(current, id), true);
    }

    /** Carrega a entidade verificando se o usuário pode vê-la (usado também pelos anexos). */
    @Transactional(readOnly = true)
    public Ticket loadEntity(User current, Long id) { return load(current, id); }

    public TicketResponse create(User current, TicketRequest req) {
        Category category = categories.findById(req.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria inválida"));
        Ticket t = new Ticket();
        t.setTitle(req.title().trim());
        t.setDescription(req.description().trim());
        t.setPriority(req.priority() != null ? req.priority() : TicketPriority.MEDIUM);
        t.setSector(req.sector().trim());
        t.setCategory(category);
        t.setRequester(current);
        if (settings.current().isAutoAssign()) {
            pickTechnician().ifPresent(tech -> {
                t.setAssignee(tech);
                t.setStatus(TicketStatus.IN_PROGRESS);
            });
        }
        return TicketResponse.of(tickets.save(t), true);
    }

    public TicketResponse changeStatus(User current, Long id, TicketStatus status) {
        requireStaff(current);
        Ticket t = load(current, id);
        t.setStatus(status);
        boolean done = status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED;
        t.setClosedAt(done ? Instant.now() : null);
        if (t.getAssignee() == null && status == TicketStatus.IN_PROGRESS) t.setAssignee(current);
        if (t.getFirstResponseAt() == null) t.setFirstResponseAt(Instant.now());
        return TicketResponse.of(t, true);
    }

    public TicketResponse assign(User current, Long id, Long assigneeId) {
        requireStaff(current);
        Ticket t = load(current, id);
        if (assigneeId == null) {
            t.setAssignee(null);
        } else {
            User a = users.findById(assigneeId)
                    .filter(u -> u.isActive() && isStaff(u))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Técnico inválido"));
            t.setAssignee(a);
            if (t.getStatus() == TicketStatus.OPEN) t.setStatus(TicketStatus.IN_PROGRESS);
        }
        return TicketResponse.of(t, true);
    }

    public TicketResponse comment(User current, Long id, String content) {
        Ticket t = load(current, id);
        if (t.getStatus() == TicketStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chamado encerrado não aceita novos comentários");
        }
        Comment c = new Comment();
        c.setTicket(t);
        c.setAuthor(current);
        c.setContent(content.trim());
        t.getComments().add(c);
        if (isStaff(current) && t.getFirstResponseAt() == null) t.setFirstResponseAt(Instant.now());
        tickets.saveAndFlush(t);
        return TicketResponse.of(t, true);
    }

    /** Reabre um chamado concluído/encerrado. O solicitante só pode se a configuração permitir. */
    public TicketResponse reopen(User current, Long id) {
        Ticket t = load(current, id);
        if (t.getStatus() != TicketStatus.RESOLVED && t.getStatus() != TicketStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Só é possível reabrir chamados concluídos ou encerrados");
        }
        if (!isStaff(current) && !settings.current().isAllowReopen()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "A reabertura de chamados não está habilitada. Abra um novo chamado.");
        }
        t.setStatus(t.getAssignee() != null ? TicketStatus.IN_PROGRESS : TicketStatus.OPEN);
        t.setClosedAt(null);
        return TicketResponse.of(t, true);
    }

    /** Avaliação do atendimento: apenas o solicitante, depois que o chamado foi concluído. */
    public TicketResponse rate(User current, Long id, RatingRequest req) {
        Ticket t = load(current, id);
        if (!t.getRequester().getId().equals(current.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas quem abriu o chamado pode avaliá-lo");
        }
        if (t.getStatus() != TicketStatus.RESOLVED && t.getStatus() != TicketStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Você poderá avaliar quando o chamado for concluído");
        }
        t.setRating(req.rating());
        t.setRatingComment(req.comment() == null || req.comment().isBlank() ? null : req.comment().trim());
        return TicketResponse.of(t, true);
    }

    // ---------- auxiliares
    private Optional<User> pickTechnician() {
        return users.findByRoleAndActiveTrue(Role.TECHNICIAN).stream()
                .min(Comparator.comparingLong((User u) -> tickets.countByAssigneeIdAndStatus(u.getId(), TicketStatus.IN_PROGRESS)));
    }

    private List<Ticket> find(User current, TicketStatus status, String q) {
        Specification<Ticket> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (!isStaff(current)) p.add(cb.equal(root.get("requester").get("id"), current.getId()));
            if (status != null) p.add(cb.equal(root.get("status"), status));
            if (q != null && !q.isBlank()) {
                String term = q.trim().toLowerCase();
                Predicate byTitle = cb.like(cb.lower(root.get("title")), "%" + term + "%");
                if (term.matches("\\d{1,18}")) {
                    p.add(cb.or(byTitle, cb.equal(root.get("id"), Long.parseLong(term))));
                } else {
                    p.add(byTitle);
                }
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
        return tickets.findAll(spec, Sort.by(Sort.Direction.DESC, "id"));
    }

    private Ticket load(User current, Long id) {
        Ticket t = tickets.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chamado não encontrado"));
        if (!isStaff(current) && !t.getRequester().getId().equals(current.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Você não tem acesso a este chamado");
        }
        return t;
    }

    private void requireStaff(User u) {
        if (!isStaff(u)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas a equipe de TI pode fazer isso");
    }

    private static long count(List<Ticket> all, TicketStatus s) {
        return all.stream().filter(t -> t.getStatus() == s).count();
    }

    private static long createdIn(List<Ticket> all, YearMonth month, TicketStatus status) {
        return all.stream()
                .filter(t -> Time.ym(t.getCreatedAt()).equals(month))
                .filter(t -> status == null || t.getStatus() == status)
                .count();
    }

    private static Integer delta(long current, long previous) {
        return previous == 0 ? null : (int) Math.round((current - previous) * 100.0 / previous);
    }

    public TicketService(TicketRepository tickets, CategoryRepository categories, UserRepository users, SettingsService settings) {
        this.tickets = tickets;
        this.categories = categories;
        this.users = users;
        this.settings = settings;
    }
}
