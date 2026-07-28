CREATE TABLE "institutions" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"institution_name" text NOT NULL,
	"institution_type" varchar(50) DEFAULT 'college' NOT NULL,
	"subscription_status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "institutions_institution_code_unique" UNIQUE("institution_code")
);

CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"firebase_uid" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" text NOT NULL,
	"role" varchar(50) DEFAULT 'student' NOT NULL,
	"institution_code" varchar(100) DEFAULT '',
	"institution_name" text DEFAULT '',
	"institution_type" varchar(50) DEFAULT 'school',
	"roll_no_usn" varchar(100) DEFAULT '',
	"must_change_password" boolean DEFAULT false,
	"profile_completed" boolean DEFAULT false,
	"parent_phone" varchar(20) DEFAULT '',
	"student_phone" varchar(20) DEFAULT '',
	"profile_pic_url" text DEFAULT '',
	"tenth_percentage" varchar(10) DEFAULT '',
	"twelfth_percentage" varchar(10) DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
