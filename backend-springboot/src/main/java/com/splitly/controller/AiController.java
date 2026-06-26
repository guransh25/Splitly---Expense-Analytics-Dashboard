package com.splitly.controller;

import com.splitly.dto.Dtos.*;
import com.splitly.service.GeminiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {
    private final GeminiService gemini;

    @PostMapping("/categorize")
    public CategorizeResponse categorize(@Valid @RequestBody CategorizeRequest req) {
        return gemini.categorize(req);
    }

    @PostMapping("/insights")
    public InsightsResponse insights(@Valid @RequestBody InsightsRequest req) {
        return gemini.insights(req);
    }
}
