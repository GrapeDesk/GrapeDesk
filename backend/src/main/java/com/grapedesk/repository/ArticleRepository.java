package com.grapedesk.repository;

import com.grapedesk.domain.Article;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {
    Optional<Article> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
