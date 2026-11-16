package com.grapedesk.controller;

import com.grapedesk.domain.TicketStatus;
import com.grapedesk.domain.User;
import com.grapedesk.dto.Dtos.*;
import com.grapedesk.service.AttachmentService;
import com.grapedesk.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {
    private final TicketService service;
    private final AttachmentService attachments;

    @GetMapping
    public List<TicketResponse> list(@AuthenticationPrincipal User user,
                                     @RequestParam(required = false) TicketStatus status,
                                     @RequestParam(required = false) String q) {
        return service.list(user, status, q);
    }

    @GetMapping("/stats")
    public StatsResponse stats(@AuthenticationPrincipal User user) { return service.stats(user); }

    @GetMapping("/{id}")
    public TicketResponse get(@AuthenticationPrincipal User user, @PathVariable Long id) { return service.get(user, id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponse create(@AuthenticationPrincipal User user, @Valid @RequestBody TicketRequest req) {
        return service.create(user, req);
    }

    @PatchMapping("/{id}/status")
    public TicketResponse status(@AuthenticationPrincipal User user, @PathVariable Long id,
                                 @Valid @RequestBody StatusRequest req) {
        return service.changeStatus(user, id, req.status());
    }

    @PatchMapping("/{id}/assignee")
    public TicketResponse assign(@AuthenticationPrincipal User user, @PathVariable Long id,
                                 @RequestBody AssignRequest req) {
        return service.assign(user, id, req.assigneeId());
    }

    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponse comment(@AuthenticationPrincipal User user, @PathVariable Long id,
                                  @Valid @RequestBody CommentRequest req) {
        return service.comment(user, id, req.content());
    }

    @PostMapping("/{id}/reopen")
    public TicketResponse reopen(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return service.reopen(user, id);
    }

    @PostMapping("/{id}/rating")
    public TicketResponse rate(@AuthenticationPrincipal User user, @PathVariable Long id,
                               @Valid @RequestBody RatingRequest req) {
        return service.rate(user, id, req);
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponse upload(@AuthenticationPrincipal User user, @PathVariable Long id,
                                 @RequestParam("files") List<MultipartFile> files) {
        return attachments.store(user, id, files);
    }

    public TicketController(TicketService service, AttachmentService attachments) {
        this.service = service;
        this.attachments = attachments;
    }
}
