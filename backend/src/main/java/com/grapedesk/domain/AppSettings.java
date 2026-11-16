package com.grapedesk.domain;

import jakarta.persistence.*;

/** Configurações gerais do sistema (sempre uma única linha, id = 1). */
@Entity
@Table(name = "app_settings")
public class AppSettings {
    @Id
    private Long id = 1L;

    @Column(nullable = false, length = 120)
    private String companyName = "Grape Desk";

    @Column(nullable = false, length = 160)
    private String supportEmail = "tecnologia@ferrazdevasconcelos.sp.gov.br";

    @Column(length = 40)
    private String supportPhone = "(11) 4674-7418";

    @Column(nullable = false, length = 60)
    private String timezone = "(GMT-03:00) Brasília";

    @Column(nullable = false, length = 40)
    private String language = "Português (Brasil)";

    @Column(columnDefinition = "TEXT")
    private String logo;

    private boolean autoAssign = true;
    private boolean allowReopen = false;
    private boolean requireAttachments = true;

    @Column(nullable = false, length = 30)
    private String firstResponse = "2 horas";

    @Column(nullable = false, length = 30)
    private String resolution = "24 horas";

    @Column(nullable = false, length = 30)
    private String autoClose = "5 dias";

    public AppSettings() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getSupportEmail() {
        return supportEmail;
    }

    public void setSupportEmail(String supportEmail) {
        this.supportEmail = supportEmail;
    }

    public String getSupportPhone() {
        return supportPhone;
    }

    public void setSupportPhone(String supportPhone) {
        this.supportPhone = supportPhone;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getLogo() {
        return logo;
    }

    public void setLogo(String logo) {
        this.logo = logo;
    }

    public boolean isAutoAssign() {
        return autoAssign;
    }

    public void setAutoAssign(boolean autoAssign) {
        this.autoAssign = autoAssign;
    }

    public boolean isAllowReopen() {
        return allowReopen;
    }

    public void setAllowReopen(boolean allowReopen) {
        this.allowReopen = allowReopen;
    }

    public boolean isRequireAttachments() {
        return requireAttachments;
    }

    public void setRequireAttachments(boolean requireAttachments) {
        this.requireAttachments = requireAttachments;
    }

    public String getFirstResponse() {
        return firstResponse;
    }

    public void setFirstResponse(String firstResponse) {
        this.firstResponse = firstResponse;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public String getAutoClose() {
        return autoClose;
    }

    public void setAutoClose(String autoClose) {
        this.autoClose = autoClose;
    }
}
