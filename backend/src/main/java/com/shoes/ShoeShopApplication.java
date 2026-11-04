package com.shoes;

import com.shoes.repository.RefreshTokenRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ShoeShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShoeShopApplication.class, args);
        System.out.println("====== SHOE SHOP BACKEND STARTED SUCCESSFULLY ======");
    }
}
