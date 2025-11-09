package com.event.seating.service;

import com.event.seating.dto.AllocateRequest;
import com.event.seating.dto.ReserveRequest;
import com.event.seating.dto.ReserveResponse;
import com.event.seating.dto.SeatCreateRequest;
import com.event.seating.dto.SeatStatusDto;
import com.event.seating.model.EventSeat;
import com.event.seating.model.Events;
import com.event.seating.model.SeatHold;
import com.event.seating.model.SeatHoldStatus;
import com.event.seating.repository.EventSeatRepository;
import com.event.seating.repository.EventsRepository;
import com.event.seating.repository.SeatHoldRepository;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SeatingService {

    private final EventSeatRepository seatRepo;
    private final SeatHoldRepository holdRepo;
    private final EventsRepository eventsRepo;
    private final long holdTtlSeconds;
    ZoneId zoneId = ZoneId.of("Asia/Kolkata");

    public SeatingService(EventSeatRepository seatRepo,
                          SeatHoldRepository holdRepo,
                          EventsRepository eventsRepo,
                          Environment env) {
        this.seatRepo = seatRepo;
        this.holdRepo = holdRepo;
        this.eventsRepo = eventsRepo;
        String prop = env.getProperty("seating.hold.ttl-seconds", "90");
        long ttl;
        try {
            ttl = Long.parseLong(prop);
        } catch (NumberFormatException ex) {
            ttl = 90L;
        }
        this.holdTtlSeconds = ttl;
    }

    /**
     * Returns all events
     */
    public List<Events> listEvents()
    {
    	return eventsRepo.findAll();
    }

    @Transactional
    public List<EventSeat> addSeatsToEvent(String eventId, List<SeatCreateRequest> seats) {
        Events event = eventsRepo.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found: " + eventId));

        List<EventSeat> existingSeats = seatRepo.findByEventId(eventId);
        Set<String> existingCodes = existingSeats.stream()
                .map(EventSeat::getSeatCode)
                .collect(Collectors.toSet());
        int nextNumber = existingSeats.stream()
                .map(EventSeat::getSeatNumber)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0) + 1;

        List<EventSeat> created = new ArrayList<>();
        for (SeatCreateRequest req : seats) {
            if (req.getSeatCode() == null || req.getSeatCode().isBlank()) {
                throw new IllegalArgumentException("Seat code is required");
            }
            if (existingCodes.contains(req.getSeatCode())) {
                continue; // skip duplicates
            }

            EventSeat seat = new EventSeat();
            seat.setId(UUID.randomUUID().toString());
            seat.setEventId(event.getEventId());
            seat.setSeatCode(req.getSeatCode());
            seat.setSection(req.getSection());
            seat.setRowLabel(req.getRowLabel());
            seat.setSeatNumber(Optional.ofNullable(req.getSeatNumber()).orElse(nextNumber++));
            BigDecimal price = Optional.ofNullable(req.getPrice()).orElse(BigDecimal.valueOf(250));
            seat.setPrice(price);
            created.add(seat);
            existingCodes.add(req.getSeatCode());
        }

        return created.isEmpty() ? Collections.emptyList() : seatRepo.saveAll(created);
    }

    @Transactional
    public ReserveResponse reserve(ReserveRequest req) {
        // Idempotency
        String idemKey = req.getIdempotencyKey();
        if (idemKey != null && !idemKey.isBlank()) {
            Optional<SeatHold> ex = holdRepo.findByIdempotencyKey(idemKey);
            if (ex.isPresent()) {
                SeatHold sh = ex.get();
                ReserveResponse r = new ReserveResponse();
                r.setHoldToken(sh.getHoldToken());
                r.setHoldExpiry(sh.getHoldExpiry());
                r.setReservedSeatCodes(Collections.singletonList(getSeatCodeByEventSeatId(sh.getEventSeatId())));
                r.setMessage("idempotent: returning existing hold");
                return r;
            }
        }

        List<String> reservedSeatCodes = new ArrayList<>();
        String holdToken = UUID.randomUUID().toString();
        OffsetDateTime now = OffsetDateTime.now(zoneId);

        for (String seatCode : req.getSeatCodes()) {
            EventSeat seat = seatRepo.findByEventIdAndSeatCode(req.getEventId(), seatCode)
                    .orElseThrow(() -> new IllegalArgumentException("Seat not found: " + seatCode));

            // Check active holds/allocations for this seat
            boolean alreadyHeld = holdRepo.findAll().stream()
                    .anyMatch(h -> seat.getId().equals(h.getEventSeatId())
                            && (h.getStatus() == SeatHoldStatus.HOLD || h.getStatus() == SeatHoldStatus.ALLOCATED)
                            && (h.getStatus() == SeatHoldStatus.ALLOCATED || h.getHoldExpiry().isAfter(now)));

            if (alreadyHeld) {
                throw new IllegalStateException("Seat already held/allocated: " + seatCode);
            }

            SeatHold sh = new SeatHold();
            sh.setId(UUID.randomUUID().toString());
            sh.setEventSeatId(seat.getId());
            sh.setUserId(req.getUserId());
            sh.setHoldToken(holdToken);
            sh.setStatus(SeatHoldStatus.HOLD);
            sh.setCreatedAt(now);
            sh.setHoldExpiry(now.plusSeconds(holdTtlSeconds));
            sh.setIdempotencyKey(idemKey);
            holdRepo.save(sh);

            reservedSeatCodes.add(seatCode);
        }

        ReserveResponse resp = new ReserveResponse();
        resp.setHoldToken(holdToken);
        resp.setHoldExpiry(OffsetDateTime.now(zoneId).plusSeconds(holdTtlSeconds));
        resp.setReservedSeatCodes(reservedSeatCodes);
        resp.setMessage("Seats reserved (hold)");
        return resp;
    }

    @Transactional
    public void allocate(AllocateRequest req) {
    	// fetch all seat-hold rows for the token
        List<SeatHold> holds = holdRepo.findByHoldToken(req.getHoldToken());
        if (holds == null || holds.isEmpty()) {
            throw new IllegalArgumentException("Hold not found");
        }

        // If any hold already ALLOCATED, treat allocation as idempotent (return)
        boolean allAlreadyAllocated = holds.stream()
                .allMatch(h -> h.getStatus() == SeatHoldStatus.ALLOCATED);
        if (allAlreadyAllocated) {
            return; // idempotent: already allocated
        }

        // If any hold is RELEASED -> fail (business decision)
        boolean anyReleased = holds.stream()
                .anyMatch(h -> h.getStatus() == SeatHoldStatus.RELEASED);
        if (anyReleased) {
            throw new IllegalStateException("One or more holds already released");
        }

        // Check expiry — if any hold expired, mark them RELEASED and fail allocation
        OffsetDateTime now = OffsetDateTime.now(zoneId);
        boolean anyExpired = holds.stream()
                .anyMatch(h -> h.getHoldExpiry().isBefore(now));
        if (anyExpired) {
            // mark expired holds as RELEASED
            for (SeatHold h : holds) {
                if (h.getStatus() == SeatHoldStatus.HOLD && h.getHoldExpiry().isBefore(now)) {
                    h.setStatus(SeatHoldStatus.RELEASED);
                    holdRepo.save(h);
                }
            }
            throw new IllegalStateException("Hold expired");
        }

        // All good — allocate every hold row
        for (SeatHold h : holds) {
            h.setStatus(SeatHoldStatus.ALLOCATED);
            h.setAllocatedAt(OffsetDateTime.now(zoneId));
            h.setOrderId(req.getOrderId());
            holdRepo.save(h);
        }
    }

    @Transactional
    public void release(String holdToken) {
        List<SeatHold> holds = holdRepo.findAll().stream()
                .filter(h -> holdToken.equals(h.getHoldToken()))
                .collect(Collectors.toList());
        for (SeatHold sh : holds) {
            if (sh.getStatus() == SeatHoldStatus.ALLOCATED) {
                throw new IllegalStateException("Cannot release allocated hold: " + sh.getId());
            }
            sh.setStatus(SeatHoldStatus.RELEASED);
            holdRepo.save(sh);
        }
    }

    public Optional<SeatHold> getHoldDetails(String holdToken) {
        return holdRepo.findByHoldToken(holdToken).stream().findFirst();
    }

    // helper to map eventSeatId -> seatCode (naive single lookup)
    private String getSeatCodeByEventSeatId(String eventSeatId) {
        return seatRepo.findById(eventSeatId).map(EventSeat::getSeatCode).orElse(eventSeatId);
    }
    
    /**
     * Returns seat status for all seats of an event.
     * - If a seat has multiple holds, pick the latest relevant one (prefer ALLOCATED over HOLD).
     * - Treat expired HOLD as AVAILABLE.
     */
    @Transactional(readOnly = true)
    public List<SeatStatusDto> getSeatStatusForEvent(String eventId) {
        List<EventSeat> seats = seatRepo.findByEventId(eventId);
        if (seats == null || seats.isEmpty()) return Collections.emptyList();

        List<String> seatIds = seats.stream().map(EventSeat::getId).collect(Collectors.toList());
        List<SeatHold> holds = holdRepo.findByEventSeatIdIn(seatIds);

        // Map eventSeatId -> relevant SeatHold
        Map<String, SeatHold> chosen = new HashMap<>();
        for (SeatHold h : holds) {
            String sid = h.getEventSeatId();
            SeatHold prev = chosen.get(sid);
            if (prev == null) {
                chosen.put(sid, h);
            } else {
                // choose ALLOCATED over HOLD; otherwise newest by createdAt
                if (prev.getStatus() != SeatHoldStatus.ALLOCATED && h.getStatus() == SeatHoldStatus.ALLOCATED) {
                    chosen.put(sid, h);
                } else if (prev.getCreatedAt() != null && h.getCreatedAt() != null &&
                           h.getCreatedAt().isAfter(prev.getCreatedAt())) {
                    chosen.put(sid, h);
                }
            }
        }

        OffsetDateTime now = OffsetDateTime.now();
        List<SeatStatusDto> result = new ArrayList<>();
        for (EventSeat s : seats) {
            SeatStatusDto dto = new SeatStatusDto();
            dto.setEventSeatId(s.getId());
            dto.setSeatCode(s.getSeatCode());
            dto.setSeatNumber(s.getSeatNumber());
            dto.setSection(s.getSection());
            dto.setRowLabel(s.getRowLabel());

            SeatHold sh = chosen.get(s.getId());
            if (sh == null) {
                dto.setStatus("AVAILABLE");
            } else {
                // if hold expired and status is HOLD => treat as AVAILABLE
                if (sh.getStatus() == SeatHoldStatus.HOLD && sh.getHoldExpiry() != null && sh.getHoldExpiry().isBefore(now)) {
                    dto.setStatus("AVAILABLE");
                } else {
                    dto.setStatus(sh.getStatus().name());
                    dto.setHoldToken(sh.getHoldToken());
                    dto.setUserId(sh.getUserId());
                    dto.setHoldExpiry(sh.getHoldExpiry() != null ? sh.getHoldExpiry().toString() : null);
                }
            }
            result.add(dto);
        }
        return result;
    }


	public Events addEvent(Events event) {
		// TODO Auto-generated method stub
		return eventsRepo.save(event);
	}
	
	public EventSeat getEventDetails(String eventId)
	{
		return seatRepo.findById(eventId).orElse(null);
	}
}
