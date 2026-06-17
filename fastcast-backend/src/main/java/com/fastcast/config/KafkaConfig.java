package com.fastcast.config;

import com.fastcast.processing.event.VideoProcessingEvent;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.util.backoff.FixedBackOff;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConfig {

    public static final String VIDEO_PROCESSING_TOPIC = "video-processing";
    public static final String VIDEO_PROCESSING_DLT   = "video-processing-dlt";

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    // ── Topics ───────────────────────────────────────────────────────────────

    @Bean
    public NewTopic videoProcessingTopic() {
        return TopicBuilder.name(VIDEO_PROCESSING_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic videoProcessingDlt() {
        return TopicBuilder.name(VIDEO_PROCESSING_DLT)
                .partitions(1)
                .replicas(1)
                .build();
    }

    // ── Main producer factory + template (VideoProcessingEvent) ──────────────
    // We define this explicitly so Spring knows exactly which KafkaTemplate
    // to inject into VideoProcessingProducer.

    @Bean("mainProducerFactory")
    @Primary
    public ProducerFactory<String, VideoProcessingEvent> mainProducerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        config.put(ProducerConfig.ACKS_CONFIG, "all");
        config.put(ProducerConfig.RETRIES_CONFIG, 3);
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean("kafkaTemplate")
    @Primary
    public KafkaTemplate<String, VideoProcessingEvent> kafkaTemplate(
            @Qualifier("mainProducerFactory")
            ProducerFactory<String, VideoProcessingEvent> mainProducerFactory) {
        return new KafkaTemplate<>(mainProducerFactory);
    }

    // ── DLT producer factory + template (String→String) ──────────────────────

    @Bean("dltProducerFactory")
    public ProducerFactory<String, String> dltProducerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean("dltKafkaTemplate")
    public KafkaTemplate<String, String> dltKafkaTemplate(
            @Qualifier("dltProducerFactory")
            ProducerFactory<String, String> dltProducerFactory) {
        return new KafkaTemplate<>(dltProducerFactory);
    }

    // ── Error handler: 3 retries × 2s, then route to DLT ────────────────────

    @Bean
    public DefaultErrorHandler kafkaErrorHandler(
            @Qualifier("dltKafkaTemplate")
            KafkaTemplate<String, String> dltKafkaTemplate) {

        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
                dltKafkaTemplate,
                (record, ex) -> new org.apache.kafka.common.TopicPartition(
                        VIDEO_PROCESSING_DLT, 0)
        );

        return new DefaultErrorHandler(recoverer, new FixedBackOff(2000L, 3));
    }

    // ── Listener container factory wired with error handler ──────────────────

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Object>
    kafkaListenerContainerFactory(
            ConsumerFactory<String, Object> consumerFactory,
            DefaultErrorHandler kafkaErrorHandler) {

        ConcurrentKafkaListenerContainerFactory<String, Object> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        factory.setCommonErrorHandler(kafkaErrorHandler);
        return factory;
    }
}