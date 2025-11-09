package com.event.seating.model;

import javax.annotation.processing.Generated;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.Data;

@Entity
@Table(name = "events")
@Data
public class Events {
	
	@Id @Column(name="eventId")
	private String eventId;
	@Column(name="eventName")
	private String eventName;

}
