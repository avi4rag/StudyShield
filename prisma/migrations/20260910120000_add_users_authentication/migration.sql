-- Additive authentication foundation. Existing domain tables and rows are preserved.
CREATE TYPE "Role" AS ENUM ('EDUCATOR', 'STUDENT', 'ADMIN');

ALTER TABLE "educators" ADD COLUMN "user_id" INTEGER;
ALTER TABLE "students" ADD COLUMN "user_id" INTEGER;

CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EDUCATOR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "educators_user_id_key" ON "educators"("user_id");
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

ALTER TABLE "educators" ADD CONSTRAINT "educators_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
