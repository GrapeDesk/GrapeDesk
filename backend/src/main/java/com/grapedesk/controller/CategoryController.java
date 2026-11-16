package com.grapedesk.controller;

import com.grapedesk.dto.Dtos.CategoryResponse;
import com.grapedesk.repository.CategoryRepository;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryRepository categories;

    @GetMapping
    public List<CategoryResponse> list() {
        return categories.findAll(Sort.by("name")).stream().map(CategoryResponse::of).toList();
    }

    public CategoryController(CategoryRepository categories) {
        this.categories = categories;
    }
}
