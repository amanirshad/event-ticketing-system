package com.event.seating.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "seat_hold")
public class SeatHold {
    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String holdToken;

    @Column(name = "event_seat_id", length = 36, nullable = false)
    private String eventSeatId;

    @Column(name = "user_id", length = 36)
    private String userId;

    @Enumerated(EnumType.STRING)
    private SeatHoldStatus status = SeatHoldStatus.HOLD;

    @Column(name = "hold_expiry", nullable = false)
    private OffsetDateTime holdExpiry;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "allocated_at")
    private OffsetDateTime allocatedAt;

    @Column(name = "order_id", length = 36)
    private String orderId;

    @Column(name = "idempotency_key", length = 128)
    private String idempotencyKey;

    // getters & setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getHoldToken() { return holdToken; }
    public void setHoldToken(String holdToken) { this.holdToken = holdToken; }

    public String getEventSeatId() { return eventSeatId; }
    public void setEventSeatId(String eventSeatId) { this.eventSeatId = eventSeatId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public SeatHoldStatus getStatus() { return status; }
    public void setStatus(SeatHoldStatus status) { this.status = status; }

    public OffsetDateTime getHoldExpiry() { return holdExpiry; }
    public void setHoldExpiry(OffsetDateTime holdExpiry) { this.holdExpiry = holdExpiry; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getAllocatedAt() { return allocatedAt; }
    public void setAllocatedAt(OffsetDateTime allocatedAt) { this.allocatedAt = allocatedAt; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
}
