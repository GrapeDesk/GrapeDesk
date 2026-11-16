package com.grapedesk.service;

import com.grapedesk.domain.Attachment;
import com.grapedesk.domain.Ticket;
import com.grapedesk.domain.TicketStatus;
import com.grapedesk.domain.User;
import com.grapedesk.dto.Dtos.TicketResponse;
import com.grapedesk.repository.AttachmentRepository;
import com.grapedesk.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class AttachmentService {
    private static final Set<String> ALLOWED = Set.of("pdf", "png", "jpg", "jpeg", "gif", "webp", "txt", "log", "csv",
            "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "zip", "7z", "rar");
    private static final int MAX_PER_TICKET = 20;

    private final TicketService ticketService;
    private final TicketRepository tickets;
    private final AttachmentRepository attachments;

    @Value("${app.upload-dir}")
    private String uploadDir;

    public record Download(Resource resource, String name) {}

    @Transactional
    public TicketResponse store(User current, Long ticketId, List<MultipartFile> files) {
        Ticket t = ticketService.loadEntity(current, ticketId);
        if (t.getStatus() == TicketStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chamado encerrado não aceita novos anexos");
        }
        if (files == null || files.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nenhum arquivo enviado");
        }
        if (t.getAttachments().size() + files.size() > MAX_PER_TICKET) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Limite de " + MAX_PER_TICKET + " anexos por chamado");
        }
        for (MultipartFile f : files) {
            if (f.isEmpty()) continue;
            String original = cleanName(f.getOriginalFilename());
            if (!ALLOWED.contains(extension(original))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de arquivo não permitido: " + original);
            }
            Path dir = Paths.get(uploadDir, String.valueOf(ticketId));
            Path target = dir.resolve(UUID.randomUUID().toString());
            try {
                Files.createDirectories(dir);
                try (InputStream in = f.getInputStream()) {
                    Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível salvar o arquivo " + original);
            }
            Attachment a = new Attachment();
            a.setTicket(t);
            a.setFileName(original);
            a.setContentType(f.getContentType());
            a.setSize(f.getSize());
            a.setStoragePath(target.toString());
            a.setUploadedBy(current);
            t.getAttachments().add(a);
        }
        tickets.saveAndFlush(t);
        return TicketResponse.of(t, true);
    }

    @Transactional(readOnly = true)
    public Download download(User current, Long id) {
        Attachment a = attachments.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Anexo não encontrado"));
        ticketService.loadEntity(current, a.getTicket().getId()); // garante que o usuário pode ver o chamado
        Path path = Paths.get(a.getStoragePath());
        if (!Files.exists(path)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Arquivo não encontrado no servidor");
        }
        return new Download(new FileSystemResource(path), a.getFileName());
    }

    private static String cleanName(String name) {
        String n = name == null ? "arquivo" : name.replace('\\', '/');
        n = n.substring(n.lastIndexOf('/') + 1).trim();
        if (n.isEmpty()) n = "arquivo";
        return n.length() > 200 ? n.substring(n.length() - 200) : n;
    }

    private static String extension(String name) {
        int i = name.lastIndexOf('.');
        return i < 0 ? "" : name.substring(i + 1).toLowerCase(Locale.ROOT);
    }

    public AttachmentService(TicketService ticketService, TicketRepository tickets, AttachmentRepository attachments) {
        this.ticketService = ticketService;
        this.tickets = tickets;
        this.attachments = attachments;
    }
}
