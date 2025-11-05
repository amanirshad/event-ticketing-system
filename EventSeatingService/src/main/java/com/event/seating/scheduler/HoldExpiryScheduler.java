package com.event.seating.scheduler;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.event.seating.repository.SeatHoldRepository;


import com.event.seating.model.SeatHold;
import com.event.seating.model.SeatHoldStatus;

@Component
public class HoldExpiryScheduler {

    private final SeatHoldRepository holdRepo;

    public HoldExpiryScheduler(SeatHoldRepository holdRepo) {
        this.holdRepo = holdRepo;
    }
    
    ZoneId zoneId = ZoneId.of("Asia/Kolkata");

    // runs every minute (configurable)
    @Scheduled(fixedDelayString = "${seating.hold.expiry-check-interval-seconds:60}000")
    @Transactional
    public void expireHolds() {
        OffsetDateTime now = OffsetDateTime.now(zoneId);
        List<SeatHold> expired = holdRepo.findByStatusAndHoldExpiryBefore(SeatHoldStatus.HOLD, now);
        for (SeatHold sh : expired) {
            sh.setStatus(SeatHoldStatus.RELEASED);
            holdRepo.save(sh);
            // TODO: optionally notify other services (Order service) about release via REST call or event
        }
    }
}