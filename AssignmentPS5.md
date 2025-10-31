Problem Statement 5- Event Ticketing & Seat Reservation
You are tasked with architecting and developing an Event Ticketing & Reservation System that operates over a comprehensive database encompassing users, venues, events, seats, orders, tickets, and payments. The primary objective is to implement the system using a microservices approach, ensuring at least four distinct services, each with clearly defined boundaries. Each microservice should be responsible for a specific business domain, such as user management, event management, seat reservation, and order processing, among others.
As part of this challenge, it is essential to enforce the principle of database-per-service, which means that every microservice will maintain its own dedicated database. The services must not share database tables or perform cross-database joins under any circumstances. This separation ensures loose coupling and enhances scalability, maintainability, and fault isolation within the system.
In scenarios where multiple services require access to the same data (for instance, when order processing needs user details or event information), you must design robust mechanisms for data access. This could involve implementing data replication strategies to synchronise relevant data between services, or establishing well-defined API endpoints that allow services to retrieve up-to-date information from one another in real time. Careful consideration should be given to consistency, latency, and data synchronisation challenges that may arise from this distributed architecture.
Your solution should demonstrate thoughtful design of service boundaries, clear ownership of data, and effective inter-service communication patterns. Additionally, the system should be able to handle typical workflows such as user registration, event creation, seat selection and reservation, order placement, ticket issuance, and payment processing, all while adhering to the microservices principles outlined above. Consideration for scalability, security, and resilience will also be important in your overall system design.
Provided Dataset
•	Users – customer profiles (80 users)
•	Venues – event venues (15 venues)
•	Events – scheduled events (60 events; concert/play/sports/etc.)
•	Seats – 50–200 seats per event (~7k seats total)
•	Orders – 400 sample orders
•	Tickets – tickets linked to orders/seats
•	Payments – linked to orders
Seed data (CSV + SQL) is provided for local development.
Task 1. Services (≥4) (6 Marks)
1.	Catalog Service
o	CRUD/search on events & venues
o	Publish event listings (/v1/events?city=&type=…)
o	Filter by status (ON_SALE, SOLD_OUT, CANCELLED)
2.	Seating Service
o	Seat availability, allocation, release
o	Endpoints: /v1/seats?eventId=…, /v1/seats/reserve, /v1/seats/release
3.	Order Service
o	Place/cancel orders
o	Compute totals (seat prices + 5% tax)
o	Generate tickets after confirmation
4.	Payment Service
o	Process charges & refunds
o	Enforce Idempotency-Key on POST /charge
o	Track status: PENDING, SUCCESS, FAILED, REFUNDED
5.	(Optional) Notification Service
o	Email/SMS confirmations, e-tickets

Task 2. Database Design and Pattern (1.5 Marks)
1.	User Service (auth & profiles) — owns users, credentials, profile details.
2.	Catalog Service (venues, events, seats) — owns venue/event metadata and canonical seat inventory (seat definition per event).
3.	Reservation Service (seat holds + availability) — owns transient holds and final seat allocations (reserved/locked). Critical for concurrency control.
4.	Order & Ticketing Service — owns orders and issued tickets (links to reservation or seat snapshot).
5.	Payment Service — owns payment records, integrates with gateway, and publishes payment outcomes.
•	Show an ER diagram per service and a context map showing data ownership and replicated read models.
•	Implement basic CRUD + integrity (FKs where applicable inside a service boundary).
Please Note: Seed data for local development is provided in CSV. Students may extend the dataset or add new features/entities as per their own design requirements, provided the original base schema and relations remain usable.
Task 3. Inter-Service Workflows (2.5 Marks)
Buy Tickets
1.	Client → Order Service /v1/orders (with Idempotency-Key, event, seat list).
2.	Order → Seating: RESERVE seats (temporary hold, TTL 15 mins).
3.	Order calculates total (authoritative price from Seating).
4.	Order → Payment /charge.
o	On SUCCESS: Order → CONFIRMED; Seating → ALLOCATE; generate Tickets.
o	On FAILED/Cancelled: Seating → RELEASE seats.
5.	Notification sends receipt/e-ticket.
Rules
•	Seats can be RESERVED by only one order at a time.
•	Orders cannot be confirmed unless all seats reserved & payment succeeded.
•	Event must be ON_SALE; CANCELLED events block new orders.
•	Refund required if event is cancelled.
•	Idempotency required on /orders and /payments/charge.
•	Reservation auto-expires after 15 minutes.
Task 4. Containerization with Docker (2 Marks)
•	Write a Dockerfile for each service.
•	Provide a docker compose (for local multi service bring up), including individual service containers + their DBs.
•	Verify service networking and DB connectivity.
•	Screenshots: docker ps, service health endpoints, sample API calls.

Task 5. Deployment on Minikube (Local Kubernetes) (2 Marks)
•	Create Kubernetes manifests for each service:
	Deployment (probes, resource requests/limits).
	Service (ClusterIP; NodePort/Ingress for an API gateway if used).
	ConfigMap/Secret for configuration and credentials.
	PersistentVolumeClaim for databases (or run managed DB containers with PVCs).
•	Demonstrate end to end flow inside the cluster:
	Create customer → open account → make transfer → see notification logs.
•	Screenshots: kubectl get pods, kubectl get svc, logs (kubectl logs), and a working curl/Postman run against NodePort/Ingress.
Task 6. Monitoring Tasks (2 Marks)
Observability (Golden Signals) Sample given for reference only.
Metrics (Prometheus/OpenMetrics):
Metrics: orders_total, seat_reservations_failed, payments_failed_total
Structured logs with correlation IDs.
Dashboards

Task 7. Documentation (2 Marks)

