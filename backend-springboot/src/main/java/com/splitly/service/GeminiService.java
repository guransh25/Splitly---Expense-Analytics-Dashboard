package com.splitly.service;

import com.splitly.dto.Dtos.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Calls Google Gemini directly via the public REST API.
 * Two features only: categorize a single expense, generate a short insight.
 */
@Service
public class GeminiService {

    private static final List<String> CATEGORIES = List.of(
        "Food","Transport","Shopping","Entertainment","Bills","Travel","Groceries","Health","Other");

    private final String apiKey;
    private final String model;
    private final RestTemplate http = new RestTemplate();
    private final ObjectMapper json = new ObjectMapper();

    public GeminiService(@Value("${app.gemini.api-key}") String apiKey,
                         @Value("${app.gemini.model}") String model) {
        this.apiKey = apiKey;
        this.model = model;
    }

    public CategorizeResponse categorize(CategorizeRequest req) {
        String prompt = "Classify this expense into ONE of: " + String.join(", ", CATEGORIES) +
            ". Reply with only the category name, nothing else.\nTitle: " + req.title() +
            "\nAmount: " + req.amount();
        String text = call(prompt).trim();
        String chosen = CATEGORIES.stream().filter(c -> text.equalsIgnoreCase(c)).findFirst().orElse("Other");
        return new CategorizeResponse(chosen);
    }

    public InsightsResponse insights(InsightsRequest req) {
        if (req.expenses().isEmpty()) {
            return new InsightsResponse("—", "No expenses yet.", "Add your first expense to see AI insights!");
        }
        String prompt = "You are a friendly financial coach. Reply in strict JSON with keys " +
            "topCategory, summary, tip — short fields, no code fences.\nExpenses: " +
            req.expenses().toString();
        String text = call(prompt).trim().replaceAll("^```json|```$", "").trim();
        try {
            JsonNode n = json.readTree(text);
            return new InsightsResponse(
                n.path("topCategory").asText("—"),
                n.path("summary").asText(""),
                n.path("tip").asText(""));
        } catch (Exception e) {
            return new InsightsResponse("—", "Could not parse AI response.", text);
        }
    }

    private String call(String prompt) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;
        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<JsonNode> res = http.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers), JsonNode.class);
        return res.getBody().path("candidates").path(0).path("content").path("parts").path(0).path("text").asText("");
    }
}
