package com.event.seating.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.event.seating.model.Events;

public interface EventsRepository extends JpaRepository<Events, String> {

}
