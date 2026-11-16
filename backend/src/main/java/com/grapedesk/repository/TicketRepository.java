package com.grapedesk.repository;

import com.grapedesk.domain.Ticket;
import com.grapedesk.domain.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.Instant;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {
    long countByAssigneeIdAndStatus(Long assigneeId, TicketStatus status);
    List<Ticket> findByStatusAndUpdatedAtBefore(TicketStatus status, Instant limit);
}
