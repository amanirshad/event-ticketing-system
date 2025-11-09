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

```bash
git clone https://github.com/amanirshad/event-ticketing-system.git
cd event-ticketing-system
```

Run the helper script (builds images, captures baseline health checks, applies shared manifests):

```bash
./setup-local.sh
```

Launch all services locally via Docker Compose:

```bash
docker-compose up --build
```

Key endpoints (see `docker-compose.yml` for the complete list):

| Service | URL |
| --- | --- |
| user-service | http://localhost:8080 |
| catalog-service | http://localhost:3002 |
| order-service | http://localhost:3007 |
| payment-service | http://localhost:3004 |
| event-seating-service | http://localhost:4000 |
| notification-service | http://localhost:3005 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

Use the provided Postman collection (`event-ticketing-system.postman_collection.json`) for manual API testing.

### End-to-End Flow Test

The automated script in `scripts/e2e-test.js` executes the complete “buy tickets” flow:

1. Register and log in a user.
2. Create an event in catalog and synchronise it with event-seating.
3. Seed seats for the event and verify availability.
4. Reserve seats via the seating service.
5. Create an order and obtain a payment dev token.
6. Charge the order using payment-service.
7. Allocate seat holds and fetch the final order summary.

Run the script once the Docker stack is up:

```bash
npm install axios uuid    # first run only (installs axios & uuid)
node scripts/e2e-test.js
```

The script logs each step and finishes with `End-to-end flow completed successfully`, printing the final order/tickets JSON. Adjust the base URLs inside the script if you change ports or target Kubernetes.

> **Note:** payment-service expects MongoDB credentials. The default Compose URI is `mongodb://root:example@mongodb:27017/payment-service?authSource=admin`. Update it if your Mongo credentials differ.

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

- **Automated E2E:** `node scripts/e2e-test.js` (see instructions above).
- **API collection:** Import `event-ticketing-system.postman_collection.json` into Postman to hit individual service endpoints.
- **Service-level tests:** Use the language-specific tooling within each service directory (e.g., Maven, npm test) to expand coverage.
- **E2E log artifact:** Latest run output is captured at `log/e2e-run.log` (ANSI-stripped) with Docker service logs appended. Share this file with evaluators to demonstrate the narrated end-to-end workflow plus container activity (sample excerpt below).

```text
$ tail -n 40 log/e2e-run.log
... (Health checks, user registration, catalog event creation, seating sync, order, payment, allocation, final order) ...
✔ End-to-end flow completed successfully
```

Monitoring & Kubernetes

The monitoring/ folder contains files to set up metrics, dashboards and alert rules (e.g., using Prometheus, Grafana).

The k8s/ directory contains Kubernetes manifests for all services — including Deployments, Services, ConfigMaps, Secrets, Ingress.

For production, you’ll need to supply real certificates, domain names, secrets and configure a reliable database, caching layer, message broker if used.
