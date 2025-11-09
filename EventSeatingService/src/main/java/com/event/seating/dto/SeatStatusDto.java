package com.event.seating.dto;

public class SeatStatusDto {
    private String eventSeatId;   // internal id
    private String seatCode;      // human code like A1
    private Integer seatNumber;
    private String section;
    private String rowLabel;
    private String status;        // AVAILABLE | HOLD | ALLOCATED | RELEASED
    private String holdToken;     // if held/allocated
    private String userId;        // who holds
    private String holdExpiry;    // ISO string or null

    public String getEventSeatId() {
        return eventSeatId;
    }

    public void setEventSeatId(String eventSeatId) {
        this.eventSeatId = eventSeatId;
    }

    public String getSeatCode() {
        return seatCode;
    }

    public void setSeatCode(String seatCode) {
        this.seatCode = seatCode;
    }

    public Integer getSeatNumber() {
        return seatNumber;
    }

    public void setSeatNumber(Integer seatNumber) {
        this.seatNumber = seatNumber;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public String getRowLabel() {
        return rowLabel;
    }

    public void setRowLabel(String rowLabel) {
        this.rowLabel = rowLabel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getHoldToken() {
        return holdToken;
    }

    public void setHoldToken(String holdToken) {
        this.holdToken = holdToken;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getHoldExpiry() {
        return holdExpiry;
    }

    public void setHoldExpiry(String holdExpiry) {
        this.holdExpiry = holdExpiry;
    }
}