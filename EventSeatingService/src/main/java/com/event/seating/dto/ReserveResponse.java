package com.event.seating.dto;

import java.time.OffsetDateTime;
import java.util.List;

public class ReserveResponse {
    private String holdToken;
    private OffsetDateTime holdExpiry;
    private List<String> reservedSeatCodes;
    private String message;

    public String getHoldToken() { return holdToken; }
    public void setHoldToken(String holdToken) { this.holdToken = holdToken; }

    public OffsetDateTime getHoldExpiry() { return holdExpiry; }
    public void setHoldExpiry(OffsetDateTime holdExpiry) { this.holdExpiry = holdExpiry; }

    public List<String> getReservedSeatCodes() { return reservedSeatCodes; }
    public void setReservedSeatCodes(List<String> reservedSeatCodes) { this.reservedSeatCodes = reservedSeatCodes; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
