package com.grapedesk.controller;

import com.grapedesk.dto.Dtos.ReportSummary;
import com.grapedesk.service.ReportService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService service;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ReportSummary summary() { return service.summary(); }

    public ReportController(ReportService service) {
        this.service = service;
    }
}
