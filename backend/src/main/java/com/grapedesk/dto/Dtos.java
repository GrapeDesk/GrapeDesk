package com.grapedesk.dto;

import com.grapedesk.domain.*;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

public final class Dtos {
    private Dtos() {}

    // ---------- autenticação e usuários
    public record LoginRequest(
            @NotBlank(message = "Informe o e-mail") @Email(message = "E-mail inválido") String email,
            @NotBlank(message = "Informe a senha") String password) {}

    public record LoginResponse(String token, UserResponse user) {}

    public record UserResponse(Long id, String name, String email, Role role, String department, boolean active) {
        public static UserResponse of(User u) {
            if (u == null) return null;
            return new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getDepartment(), u.isActive());
        }
    }

    public record CreateUserRequest(
            @NotBlank(message = "Informe o nome") @Size(max = 120, message = "Nome muito longo") String name,
            @NotBlank(message = "Informe o e-mail") @Email(message = "E-mail inválido") String email,
            @NotBlank(message = "Informe a senha") @Size(min = 6, max = 72, message = "A senha deve ter de 6 a 72 caracteres") String password,
            @NotNull(message = "Informe o perfil") Role role,
            @Size(max = 120, message = "Departamento muito longo") String department) {}

    // ---------- chamados
    public record CategoryResponse(Long id, String name) {
        public static CategoryResponse of(Category c) { return new CategoryResponse(c.getId(), c.getName()); }
    }

    public record TicketRequest(
            @NotBlank(message = "Informe o título") @Size(max = 150, message = "Título muito longo (máximo 150)") String title,
            @NotBlank(message = "Informe a descrição") String description,
            TicketPriority priority,
            @NotBlank(message = "Informe o setor") @Size(max = 80, message = "Setor muito longo") String sector,
            @NotNull(message = "Informe a categoria") Long categoryId) {}

    public record StatusRequest(@NotNull(message = "Informe o status") TicketStatus status) {}
    public record AssignRequest(Long assigneeId) {}
    public record CommentRequest(@NotBlank(message = "Escreva o comentário") String content) {}

    public record RatingRequest(
            @NotNull(message = "Informe a nota") @Min(value = 1, message = "A nota mínima é 1") @Max(value = 5, message = "A nota máxima é 5") Integer rating,
            @Size(max = 500, message = "Comentário muito longo (máximo 500)") String comment) {}

    public record CommentResponse(Long id, String content, UserResponse author, Instant createdAt) {
        public static CommentResponse of(Comment c) {
            return new CommentResponse(c.getId(), c.getContent(), UserResponse.of(c.getAuthor()), c.getCreatedAt());
        }
    }

    public record AttachmentResponse(Long id, String name, long size) {
        public static AttachmentResponse of(Attachment a) { return new AttachmentResponse(a.getId(), a.getFileName(), a.getSize()); }
    }

    public record TicketResponse(
            Long id, String title, String description, TicketStatus status, TicketPriority priority, String sector,
            CategoryResponse category, UserResponse requester, UserResponse assignee,
            Instant createdAt, Instant updatedAt, Instant closedAt,
            Integer rating, String ratingComment,
            List<CommentResponse> comments, List<AttachmentResponse> attachments) {

        public static TicketResponse of(Ticket t, boolean withDetails) {
            return new TicketResponse(
                    t.getId(), t.getTitle(), t.getDescription(), t.getStatus(), t.getPriority(), t.getSector(),
                    CategoryResponse.of(t.getCategory()), UserResponse.of(t.getRequester()), UserResponse.of(t.getAssignee()),
                    t.getCreatedAt(), t.getUpdatedAt(), t.getClosedAt(), t.getRating(), t.getRatingComment(),
                    withDetails ? t.getComments().stream().map(CommentResponse::of).toList() : List.of(),
                    withDetails ? t.getAttachments().stream().map(AttachmentResponse::of).toList() : List.of());
        }
    }

    /** Contadores por status; os "delta" comparam o mês atual com o anterior (null quando não há base de comparação). */
    public record StatsResponse(
            long total, long open, long inProgress, long waiting, long resolved, long closed,
            Integer totalDelta, Integer inProgressDelta, Integer resolvedDelta, Integer waitingDelta) {}

    // ---------- configurações
    public record SettingsDto(
            @NotBlank(message = "Informe o nome da empresa") @Size(max = 120, message = "Nome muito longo") String companyName,
            @NotBlank(message = "Informe o e-mail de suporte") @Email(message = "E-mail de suporte inválido") @Size(max = 160, message = "E-mail muito longo") String supportEmail,
            @Size(max = 40, message = "Telefone muito longo") String supportPhone,
            @NotBlank(message = "Informe o fuso horário") @Size(max = 60, message = "Fuso horário muito longo") String timezone,
            @NotBlank(message = "Informe o idioma") @Size(max = 40, message = "Idioma muito longo") String language,
            String logo,
            boolean autoAssign, boolean allowReopen, boolean requireAttachments,
            @NotBlank(message = "Informe o prazo de resposta") @Size(max = 30, message = "Prazo muito longo") String firstResponse,
            @NotBlank(message = "Informe o prazo de resolução") @Size(max = 30, message = "Prazo muito longo") String resolution,
            @NotBlank(message = "Informe o encerramento automático") @Size(max = 30, message = "Prazo muito longo") String autoClose) {

        public static SettingsDto of(AppSettings s) {
            return new SettingsDto(s.getCompanyName(), s.getSupportEmail(), s.getSupportPhone(), s.getTimezone(), s.getLanguage(),
                    s.getLogo(), s.isAutoAssign(), s.isAllowReopen(), s.isRequireAttachments(),
                    s.getFirstResponse(), s.getResolution(), s.getAutoClose());
        }
    }

    // ---------- base de conhecimento
    public record ArticleRequest(
            @NotBlank(message = "Informe o título") @Size(max = 200, message = "Título muito longo") String title,
            @NotBlank(message = "Informe o resumo") @Size(max = 300, message = "Resumo muito longo") String summary,
            @NotBlank(message = "Informe a categoria") @Size(max = 60, message = "Categoria muito longa") String category,
            @Size(max = 40, message = "Ícone inválido") String icon,
            @NotEmpty(message = "Informe pelo menos um passo") List<@NotBlank(message = "Passo vazio") String> steps,
            @Size(max = 300, message = "Palavras-chave muito longas") String keywords,
            Boolean important) {}

    public record ArticleResponse(Long id, String slug, String title, String summary, String category, String icon,
                                  List<String> steps, String keywords, boolean important) {
        public static ArticleResponse of(Article a) {
            List<String> steps = Arrays.stream(a.getSteps().split("\n")).map(String::trim).filter(s -> !s.isEmpty()).toList();
            return new ArticleResponse(a.getId(), a.getSlug(), a.getTitle(), a.getSummary(), a.getCategory(), a.getIcon(),
                    steps, a.getKeywords(), a.isImportant());
        }
    }

    // ---------- relatórios
    public record Monthly(String label, long value) {}
    public record PriorityCount(TicketPriority priority, long count) {}
    public record SectorCount(String sector, long count) {}
    public record TimeAvg(String value, int delta) {}
    public record TechPerformance(Long id, String name, long resolved, long inProgress, String tmr, double rating) {}
    public record Satisfaction(double average, int positivePct) {}
    public record Insight(String icon, String text) {}

    public record ReportSummary(
            long total, List<Monthly> monthly, List<PriorityCount> priority, List<SectorCount> sectors,
            TimeAvg avgResponse, TimeAvg avgResolution, List<TechPerformance> technicians,
            Satisfaction satisfaction, List<Insight> insights) {}
}
