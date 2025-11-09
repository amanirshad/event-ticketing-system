Event Ticketing System

A microservices-based event ticketing platform. It supports users, events, catalog, orders, payments, notifications and event-seating services — built to facilitate scalable event registration, ticketing and management.

Table of Contents

Project Overview

Architecture & Services

Getting Started

Prerequisites

Local Setup

Service List

Development & Deployment

Testing

Monitoring & Kubernetes

Contributing

License

Project Overview

This project implements a full-stack event-ticketing ecosystem comprising multiple services:

A user‐service for user management and authentication

A catalog‐service to list events, ticket types, seating etc.

An order‐service to manage ticket purchase orders

A payment‐service to handle payment processing

A notification‐service to send emails / alerts

An event-seating service for seat allocation/seat maps

Monitoring infrastructure, Kubernetes manifests and dev/ops tooling

The system uses containerisation and is orchestrated via Docker (and optionally Kubernetes). It is designed to be modular, scalable, and suitable for real-world event ticketing scenarios (concerts, conferences, theatre etc.).

Architecture & Services

Each service is a self-contained microservice. At a high level:

Services communicate via REST or event‐driven messaging (depending on implementation)

Payment service integrates with external payment gateway(s)

Order service uses catalog data to reserve seats/tickets

Notification service handles user communications (confirmation emails, reminders)

Event seating service manages seat maps and availability (important for venues)

Monitoring infrastructure captures logs, metrics, traces (via the monitoring/ directory)

Kubernetes manifests in k8s/ directory enable production-style deployment

Getting Started
Prerequisites

Docker & Docker Compose installed

(Optional) Kubernetes cluster (e.g., minikube, kind) if deploying via k8s/

Node.js (if front-end or scripts present)

Java/other runtime depending on service languages

Environment variables and secrets configured (see setup-local.sh)

Local Setup

Clone the repository:

git clone https://github.com/amanirshad/event-ticketing-system.git  
cd event-ticketing-system  


Run the setup script (initialise environment, create databases etc):

./setup-local.sh  


Launch all services locally via Docker Compose:

docker-compose up --build  


Access the services — e.g., user-service at http://localhost:<port> (ports configured in docker-compose.yml).

Use the provided Postman collection (event-ticketing-system.postman_collection.json) to test endpoints.

Service List

Here is a breakdown of the services and their purpose:

Service	Description
user-service	Handles user registration, login, profile management.
catalog-service	Manages events catalogue, ticket types, venue and seating metadata.
order-service	Handles ticket orders, reservations, holds, confirmations.
payment-service	Processes payments, interfaces with payment gateways, validates payment status.
notification-service	Sends confirmation emails, notifications, reminders to users and organisers.
event-seating-service	Manages seat availability, seat maps, configurations per venue.
monitoring/	Infrastructure for dashboards, metrics (e.g., Prometheus, Grafana) and logs.
k8s/	Kubernetes manifests for deploying in production-grade environment.

Included files:

docker-compose.yml: define multi-container local environment

setup-local.sh: initial setup script

.gitignore, .eslintrc.js, etc: config files for linting, ignoring, etc

Development & Deployment

Follow service folder conventions: each service resides in its directory and has its own build/run instructions.

Environment variables are centralised; reference setup-local.sh to see what’s required.

For production deployment: use the k8s/ directory to apply manifests, configure ingress, secrets, load-balancers.

Ensure you configure monitoring, logging, tracing for full observability (check monitoring/).

Testing

Use the Postman collection provided (event-ticketing-system.postman_collection.json) to test the endpoints, flows like:

User login/register

Browse events (via catalog)

Reserve tickets (order service)

Process payment (payment-service)

Send confirmation (notification-service)

Use service-specific test frameworks (unit tests, integration tests) within each service folder (depending on language) to ensure functionality.

Monitoring & Kubernetes

The monitoring/ folder contains files to set up metrics, dashboards and alert rules (e.g., using Prometheus, Grafana).

The k8s/ directory contains Kubernetes manifests for all services — including Deployments, Services, ConfigMaps, Secrets, Ingress.

For production, you’ll need to supply real certificates, domain names, secrets and configure a reliable database, caching layer, message broker if used.
