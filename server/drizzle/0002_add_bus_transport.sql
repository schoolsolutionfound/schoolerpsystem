CREATE TABLE IF NOT EXISTS "bus_vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"registration_no" varchar(50) NOT NULL,
	"capacity" integer DEFAULT 30 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_bus_vehicles_inst_reg" UNIQUE("institution_code", "registration_no")
);

CREATE TABLE IF NOT EXISTS "bus_routes" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"vehicle_id" text,
	"driver_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_bus_routes_driver" ON "bus_routes" ("driver_id");

CREATE TABLE IF NOT EXISTS "bus_stops" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"route_id" text NOT NULL,
	"name" varchar(200) NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"sequence" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_bus_stops_route_seq" ON "bus_stops" ("route_id", "sequence");

CREATE TABLE IF NOT EXISTS "student_transport" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"student_id" text NOT NULL,
	"route_id" text NOT NULL,
	"stop_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_student_transport_student_route" UNIQUE("student_id", "route_id")
);

CREATE INDEX IF NOT EXISTS "idx_student_transport_route" ON "student_transport" ("route_id");

CREATE TABLE IF NOT EXISTS "bus_trips" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"route_id" text NOT NULL,
	"driver_id" text NOT NULL,
	"trip_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'live' NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_bus_trips_live_driver" ON "bus_trips" ("driver_id") WHERE "status" = 'live';
CREATE INDEX IF NOT EXISTS "idx_bus_trips_live_route" ON "bus_trips" ("route_id") WHERE "status" = 'live';

CREATE TABLE IF NOT EXISTS "bus_locations" (
	"trip_id" text PRIMARY KEY NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"speed" numeric(5, 2),
	"heading" numeric(5, 2),
	"updated_at" timestamp DEFAULT now()
);
