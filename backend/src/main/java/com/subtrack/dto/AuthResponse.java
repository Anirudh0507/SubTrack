
package com.subtrack.dto;

public class AuthResponse {

    private Long id;
    private String name;
    private String email;
    private String token;
    private String tokenType;

    public AuthResponse() {
    }

    public AuthResponse(
            Long id,
            String name,
            String email,
            String token,
            String tokenType) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.token = token;
        this.tokenType = tokenType;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getToken() {
        return token;
    }

    public String getTokenType() {
        return tokenType;
    }
}
