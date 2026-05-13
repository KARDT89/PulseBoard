import { pgTable, varchar, uuid, boolean, text, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';

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

export const pollsTable = pgTable('polls', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').references(() => usersTable.id),
  title: text('title').notNull(),
  description: text('description'),
  isAnonymous: boolean('is_anonymous').default(false),
  expiresAt: timestamp('expires_at').notNull(),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const questionsTable = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  pollId: uuid('poll_id').references(() => pollsTable.id, { onDelete: 'cascade' }).notNull(),
  text: text('text').notNull(),
  isMandatory: boolean('is_mandatory').default(true),
  order: integer('order').notNull(),
});

export const optionsTable = pgTable('options', {
  id: uuid('id').defaultRandom().primaryKey(),
  questionId: uuid('question_id').references(() => questionsTable.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
});

export const responsesTable = pgTable('responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  pollId: uuid('poll_id').references(() => pollsTable.id).notNull(),
  respondentId: uuid('respondent_id').references(() => usersTable.id), // null = anonymous
  submittedAt: timestamp('submitted_at').defaultNow(),
});

export const answersTable = pgTable('answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  responseId: uuid('response_id').references(() => responsesTable.id, { onDelete: 'cascade' }).notNull(),
  questionId: uuid('question_id').references(() => questionsTable.id).notNull(),
  optionId: uuid('option_id').references(() => optionsTable.id).notNull(),
});