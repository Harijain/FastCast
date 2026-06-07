package com.fastcast.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    public static final String VIDEO_PROCESSING_TOPIC = "video-processing";
    public static final String VIDEO_PROCESSING_DLT = "video-processing-dlt";

    @Bean
    public NewTopic videoProcessingTopic() {
        return TopicBuilder.name(VIDEO_PROCESSING_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    // Dead letter topic — failed messages go here
    @Bean
    public NewTopic videoProcessingDlt() {
        return TopicBuilder.name(VIDEO_PROCESSING_DLT)
                .partitions(1)
                .replicas(1)
                .build();
    }
}