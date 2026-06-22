package com.fastcast;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
		"spring.kafka.bootstrap-servers=localhost:9092",
		"spring.kafka.admin.fail-fast=false",
		"spring.kafka.listener.missing-topics-fatal=false"
})
class FastcastBackendApplicationTests {

	@MockBean
	KafkaAdmin kafkaAdmin;

	@MockBean
	@SuppressWarnings("rawtypes")
	KafkaTemplate kafkaTemplate;

	@Test
	void contextLoads() {
	}
}