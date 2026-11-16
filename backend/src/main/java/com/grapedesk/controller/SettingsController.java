package com.grapedesk.controller;

import com.grapedesk.dto.Dtos.SettingsDto;
import com.grapedesk.service.SettingsService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    private final SettingsService service;

    /** Qualquer usuário logado lê (o formulário de chamado usa, por exemplo, "anexos obrigatórios"). */
    @GetMapping
    public SettingsDto get() { return service.get(); }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public SettingsDto update(@Valid @RequestBody SettingsDto body) { return service.update(body); }

    public SettingsController(SettingsService service) {
        this.service = service;
    }
}
