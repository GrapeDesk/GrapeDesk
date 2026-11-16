package com.grapedesk.service;

import com.grapedesk.domain.Article;
import com.grapedesk.dto.Dtos.ArticleRequest;
import com.grapedesk.dto.Dtos.ArticleResponse;
import com.grapedesk.repository.ArticleRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@Transactional
public class ArticleService {
    private final ArticleRepository articles;

    @Transactional(readOnly = true)
    public List<ArticleResponse> list(String q, String category) {
        String term = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        return articles.findAll(Sort.by("id")).stream()
                .filter(a -> category == null || category.isBlank() || a.getCategory().equalsIgnoreCase(category))
                .filter(a -> term.isEmpty() || haystack(a).contains(term))
                .map(ArticleResponse::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public ArticleResponse get(String slug) {
        return ArticleResponse.of(articles.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Artigo não encontrado")));
    }

    public ArticleResponse create(ArticleRequest req) {
        Article a = new Article();
        a.setSlug(uniqueSlug(req.title()));
        apply(a, req);
        return ArticleResponse.of(articles.save(a));
    }

    public ArticleResponse update(Long id, ArticleRequest req) {
        Article a = articles.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Artigo não encontrado"));
        apply(a, req);
        return ArticleResponse.of(articles.save(a));
    }

    public void delete(Long id) {
        if (!articles.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Artigo não encontrado");
        articles.deleteById(id);
    }

    private void apply(Article a, ArticleRequest r) {
        a.setTitle(r.title().trim());
        a.setSummary(r.summary().trim());
        a.setCategory(r.category().trim());
        a.setIcon(r.icon() == null || r.icon().isBlank() ? "file-text" : r.icon().trim());
        a.setSteps(r.steps().stream().map(String::trim).collect(Collectors.joining("\n")));
        a.setKeywords(r.keywords());
        a.setImportant(Boolean.TRUE.equals(r.important()));
    }

    private String uniqueSlug(String title) {
        String base = Normalizer.normalize(title, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (base.isEmpty()) base = "artigo";
        String slug = base;
        int n = 2;
        while (articles.existsBySlug(slug)) slug = base + "-" + n++;
        return slug;
    }

    private static String haystack(Article a) {
        return (a.getTitle() + " " + a.getSummary() + " " + (a.getKeywords() == null ? "" : a.getKeywords())).toLowerCase(Locale.ROOT);
    }

    public ArticleService(ArticleRepository articles) {
        this.articles = articles;
    }
}
