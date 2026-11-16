package com.grapedesk.controller;

import com.grapedesk.dto.Dtos.ArticleRequest;
import com.grapedesk.dto.Dtos.ArticleResponse;
import com.grapedesk.service.ArticleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kb/articles")
public class ArticleController {
    private final ArticleService service;

    @GetMapping
    public List<ArticleResponse> list(@RequestParam(required = false) String q,
                                      @RequestParam(required = false) String category) {
        return service.list(q, category);
    }

    @GetMapping("/{slug}")
    public ArticleResponse get(@PathVariable String slug) { return service.get(slug); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ArticleResponse create(@Valid @RequestBody ArticleRequest req) { return service.create(req); }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ArticleResponse update(@PathVariable Long id, @Valid @RequestBody ArticleRequest req) { return service.update(id, req); }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public void delete(@PathVariable Long id) { service.delete(id); }

    public ArticleController(ArticleService service) {
        this.service = service;
    }
}
