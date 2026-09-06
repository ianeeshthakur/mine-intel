package com.mineintel.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * GeminiService — calls Google Gemini API with grounding data for the AI assistant.
 * API key is read from the GEMINI_API_KEY environment variable — never hardcoded.
 */
@Slf4j
@Service
public class GeminiService {

    private static final String GEMINI_API_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String SYSTEM_PROMPT = """
        You are the AI assistant for MINE-INTEL, a mineral exploration intelligence platform
        focused on manganese prospectivity mapping in the Balaghat district, Madhya Pradesh, India.

        STRICT RULES:
        1. ONLY answer using the data provided in the CONTEXT section below. Do NOT invent
           geological facts, deposit statistics, or any information not present in the context.
        2. If the user's question cannot be answered from the provided data, say plainly:
           "I don't have data on that in the current app context."
        3. Use hedged, evidence-based language consistent with exploration — say "supports
           further investigation," "the model suggests," "field verification is required"
           — NEVER say "confirms," "proves," or "guarantees."
        4. When discussing scores, always mention that they are ML model outputs requiring
           field verification, not ground truth.
        5. When referencing SHAP contributions, explain them as "the model's assessment of
           how much each evidence layer contributed to the score" — not as physical measurements.
        6. Keep responses concise and actionable — 2-4 paragraphs maximum.
        7. If asked about a specific target, reference its actual score, priority, and top
           contributing features from the data.
        """;

    public String chat(String userMessage, String contextData) {
        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            log.error("GEMINI_API_KEY environment variable is not set");
            return "AI Assistant is unavailable — API key not configured. Please set the GEMINI_API_KEY environment variable.";
        }

        try {
            String fullSystemPrompt = SYSTEM_PROMPT + "\n\nCONTEXT (real app data — use ONLY this):\n" + contextData;

            // Build Gemini API request body
            Map<String, Object> requestBody = Map.of(
                "system_instruction", Map.of(
                    "parts", List.of(Map.of("text", fullSystemPrompt))
                ),
                "contents", List.of(
                    Map.of("role", "user", "parts", List.of(Map.of("text", userMessage)))
                ),
                "generationConfig", Map.of(
                    "temperature", 0.3,
                    "maxOutputTokens", 1024
                )
            );

            String url = GEMINI_API_URL + "?key=" + apiKey;

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, requestBody, Map.class);

            if (response == null) {
                return "No response from AI service.";
            }

            // Extract text from Gemini response
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                if (content != null) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }

            return "I wasn't able to generate a response. Please try again.";

        } catch (Exception e) {
            log.error("Gemini API call failed: {}", e.getMessage());
            return "AI Assistant encountered an error: " + e.getMessage();
        }
    }
}
