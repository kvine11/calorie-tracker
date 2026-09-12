package com.example.calTracker.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// CORS for the whole API, configured once. It used to be a @CrossOrigin
// annotation repeated on each controller with the origin hardcoded; now the
// allowed origins come from app.cors.allowed-origins, so a deployed frontend's
// URL is an environment variable rather than a code change.
//
// Locally this rarely matters: the Vite dev server proxies /api, so the browser
// sees one origin. It's what lets a separately hosted frontend call the API.
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String[] allowedOrigins;

    public WebConfig(@Value("${app.cors.allowed-origins}") String[] allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE");
    }
}
