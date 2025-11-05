package com.event.seating.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import com.event.seating.model.SeatHold;
import com.event.seating.model.SeatHoldStatus;

import jakarta.persistence.*;

public interface SeatHoldRepository extends JpaRepository<SeatHold, String> {
    List<SeatHold> findByStatusAndHoldExpiryBefore(SeatHoldStatus status, OffsetDateTime time);

    List<SeatHold> findByHoldToken(String holdToken);

    Optional<SeatHold> findByIdempotencyKey(String idempotencyKey);
    
    // Optional: method to lock a seathold row if needed
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from SeatHold s where s.id = :id")
    Optional<SeatHold> findAndLockById(String id);
    

}
