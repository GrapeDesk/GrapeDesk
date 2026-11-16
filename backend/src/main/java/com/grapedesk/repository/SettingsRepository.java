package com.grapedesk.repository;

import com.grapedesk.domain.AppSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SettingsRepository extends JpaRepository<AppSettings, Long> {}
