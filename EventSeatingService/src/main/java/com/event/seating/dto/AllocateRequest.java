package com.event.seating.dto;

import jakarta.validation.constraints.NotBlank;

public class AllocateRequest {
    @NotBlank
    private String holdToken;
    @NotBlank
    private String orderId;

    public String getHoldToken() { return holdToken; }
    public void setHoldToken(String holdToken) { this.holdToken = holdToken; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
}
