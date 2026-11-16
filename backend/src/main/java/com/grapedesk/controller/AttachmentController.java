package com.grapedesk.controller;

import com.grapedesk.domain.User;
import com.grapedesk.service.AttachmentService;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/attachments")
public class AttachmentController {
    private final AttachmentService service;

    /** Sempre como download (attachment) e octet-stream, para que arquivos enviados nunca sejam executados no navegador. */
    @GetMapping("/{id}")
    public ResponseEntity<Resource> download(@AuthenticationPrincipal User user, @PathVariable Long id) {
        AttachmentService.Download d = service.download(user, id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(d.name(), StandardCharsets.UTF_8).build().toString())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(d.resource());
    }

    public AttachmentController(AttachmentService service) {
        this.service = service;
    }
}
