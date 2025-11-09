package com.event.seating.repository;

import com.event.seating.model.EventSeat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EventSeatRepository extends JpaRepository<EventSeat, String> {
    Optional<EventSeat> findByEventIdAndSeatCode(String eventId, String seatCode);
}