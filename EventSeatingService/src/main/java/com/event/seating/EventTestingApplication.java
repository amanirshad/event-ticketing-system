package com.event.seating;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EventTestingApplication {

	public static void main(String[] args) {
		SpringApplication.run(EventTestingApplication.class, args);
	}

}
