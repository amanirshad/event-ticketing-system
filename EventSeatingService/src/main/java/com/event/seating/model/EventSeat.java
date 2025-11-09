package com.event.seating.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "event_seat", uniqueConstraints = {
        @UniqueConstraint(name = "uk_event_seat_code", columnNames = {"event_id", "seat_code"})
})
public class EventSeat {
    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "event_id", length = 36, nullable = false)
    private String eventId;

    @Column(name = "seat_code", nullable = false)
    private String seatCode;

    private String section;
    private String rowLabel;
    private Integer seatNumber;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    // getters/setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getSeatCode() { return seatCode; }
    public void setSeatCode(String seatCode) { this.seatCode = seatCode; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public String getRowLabel() { return rowLabel; }
    public void setRowLabel(String rowLabel) { this.rowLabel = rowLabel; }

    public Integer getSeatNumber() { return seatNumber; }
    public void setSeatNumber(Integer seatNumber) { this.seatNumber = seatNumber; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
}
