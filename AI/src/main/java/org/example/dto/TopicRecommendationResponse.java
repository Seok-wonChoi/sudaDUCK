package org.example.dto;

import lombok.Data;
import java.util.List;

@Data
public class TopicRecommendationResponse {
    private List<Topic> topics;

    @Data
    public static class Topic {
        private String title;
    }
}