package com.event.seating.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
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
}