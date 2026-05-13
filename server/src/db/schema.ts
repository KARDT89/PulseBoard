import { pgTable, varchar, uuid, boolean, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const rolesEnum = pgEnum('roles', ['customer', 'seller']);

export const usersTable = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),

  name: varchar({ length: 100 }).notNull(),

  email: varchar({ length: 322 }).notNull().unique(),
  isVerified: boolean('email-verified').notNull().default(false),

  password: varchar('password', { length: 66 }).notNull(),

  role: rolesEnum().notNull().default('customer'),

  verificationToken: varchar({ length: 66 }),
  refreshToken: text(), // full JWT or varchar(64) if storing hash
  resetPasswordToken: varchar({ length: 66 }),
  resetPasswordExpires: timestamp(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});
