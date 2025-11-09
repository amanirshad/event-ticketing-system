package com.event.seating.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.event.seating.dto.AllocateRequest;
import com.event.seating.dto.ReserveRequest;
import com.event.seating.dto.ReserveResponse;
import com.event.seating.dto.SeatCreateRequest;
import com.event.seating.dto.SeatStatusDto;
import com.event.seating.model.EventSeat;
import com.event.seating.model.Events;
import com.event.seating.service.SeatingService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/v1/seating")
public class SeatingController {
	
	private final SeatingService seatingService;
	
	public SeatingController(SeatingService seatingService) {
        this.seatingService = seatingService;
    }

	@PostMapping("/reserve" )
    public ResponseEntity<ReserveResponse> reserve(@Valid @RequestBody ReserveRequest req) {
        ReserveResponse resp = seatingService.reserve(req);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/allocate")
    public ResponseEntity<String> allocate(@Valid @RequestBody AllocateRequest req) {
        seatingService.allocate(req);
        return ResponseEntity.ok("allocated");
    }

    @PostMapping("/release")
    public ResponseEntity<String> release(@Valid @RequestBody com.event.seating.dto.ReleaseRequest req) {
        seatingService.release(req.getHoldToken());
        return ResponseEntity.ok("released");
    }
    
    @GetMapping("/events")
    public ResponseEntity<List<Events>> getAllEvents()
    {
    	List<Events> events = seatingService.listEvents();
    	return ResponseEntity.ok(events);
    }
    
    @PostMapping("/events")
    public ResponseEntity<Events> addEvent(@RequestBody Events event)
    {
    	Events eve=seatingService.addEvent(event);
    	return ResponseEntity.ok(eve);
    }
    
    @GetMapping("/events/{id}")
	public ResponseEntity<List<SeatStatusDto>> getEventSeat(@PathVariable("id") String id)
	{
    	    List<SeatStatusDto> eve = seatingService.getSeatStatusForEvent(id);
		return ResponseEntity.ok(eve);
    }

	@PostMapping("/events/{eventId}/seats")
	public ResponseEntity<List<EventSeat>> addSeats(@PathVariable("eventId") String eventId,
			@Valid @RequestBody List<SeatCreateRequest> seats) {
		List<EventSeat> saved = seatingService.addSeatsToEvent(eventId, seats);
		return ResponseEntity.ok(saved);
	}

    @GetMapping("/hold/{holdToken}")
    public ResponseEntity<?> getHold(@PathVariable String holdToken) {
        return seatingService.getHoldDetails(holdToken)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
