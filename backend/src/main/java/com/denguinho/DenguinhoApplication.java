package com.denguinho;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DenguinhoApplication {
    public static void main(String[] args) {
        if (VercelStartupProxy.isVercelContainer()) {
            VercelStartupProxy.start(args);
            return;
        }
        SpringApplication.run(DenguinhoApplication.class, args);
    }
}
