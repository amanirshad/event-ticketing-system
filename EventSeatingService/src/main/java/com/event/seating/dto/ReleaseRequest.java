package com.event.seating.dto;

import jakarta.validation.constraints.NotBlank;

public class ReleaseRequest {
    @NotBlank
    private String holdToken;
    private String reason;

    public String getHoldToken() { return holdToken; }
    public void setHoldToken(String holdToken) { this.holdToken = holdToken; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
