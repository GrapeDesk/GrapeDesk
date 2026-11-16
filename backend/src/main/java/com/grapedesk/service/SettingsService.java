package com.grapedesk.service;

import com.grapedesk.domain.AppSettings;
import com.grapedesk.dto.Dtos.SettingsDto;
import com.grapedesk.repository.SettingsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SettingsService {
    private final SettingsRepository repo;

    /** Retorna as configurações (criando a linha padrão na primeira vez). */
    @Transactional
    public AppSettings current() {
        return repo.findById(1L).orElseGet(() -> repo.save(new AppSettings()));
    }

    @Transactional
    public SettingsDto get() { return SettingsDto.of(current()); }

    @Transactional
    public SettingsDto update(SettingsDto d) {
        if (d.logo() != null && d.logo().length() > 1_000_000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Logotipo muito grande (máximo de 1 MB)");
        }
        AppSettings s = current();
        s.setCompanyName(d.companyName().trim());
        s.setSupportEmail(d.supportEmail().trim());
        s.setSupportPhone(d.supportPhone());
        s.setTimezone(d.timezone());
        s.setLanguage(d.language());
        s.setLogo(d.logo());
        s.setAutoAssign(d.autoAssign());
        s.setAllowReopen(d.allowReopen());
        s.setRequireAttachments(d.requireAttachments());
        s.setFirstResponse(d.firstResponse());
        s.setResolution(d.resolution());
        s.setAutoClose(d.autoClose());
        return SettingsDto.of(repo.save(s));
    }

    /** Converte "5 dias" em 5. Retorna 0 se não for possível ler. */
    @Transactional
    public int autoCloseDays() {
        try {
            return Integer.parseInt(current().getAutoClose().trim().split("\\s+")[0]);
        } catch (RuntimeException e) {
            return 0;
        }
    }

    public SettingsService(SettingsRepository repo) {
        this.repo = repo;
    }
}
