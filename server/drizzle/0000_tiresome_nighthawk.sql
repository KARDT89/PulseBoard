CREATE TYPE "public"."roles" AS ENUM('customer', 'seller');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(322) NOT NULL,
	"email-verified" boolean DEFAULT false NOT NULL,
	"password" varchar(66) NOT NULL,
	"role" "roles" DEFAULT 'customer' NOT NULL,
	"verificationToken" varchar(66),
	"refreshToken" text,
	"resetPasswordToken" varchar(66),
	"resetPasswordExpires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
