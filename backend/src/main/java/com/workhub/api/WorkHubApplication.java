package com.workhub.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class WorkHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorkHubApplication.class, args);
    }
}
