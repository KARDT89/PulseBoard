import { db } from '../../db/index.js';
import {
  optionsTable,
  pollsTable,
  questionsTable,
  responsesTable,
  answersTable,
} from '../../db/schema.js';
import { getIo } from '../socket/index.js';
import ApiError from '../utils/api-errors.js';
import type { CreatePollInput } from './dto/create-polls.dto.js';
import type { SubmitResponseInput } from './dto/submit-response.dto.js';
import { count, desc, eq } from 'drizzle-orm';

// ── CREATE POLL ──────────────────────────────────────────────
// Why loop? Drizzle doesn't support nested inserts.
// We insert poll → then questions → then options per question.
const createPoll = async (creatorId: string, body: CreatePollInput) => {
  return await db.transaction(async (tx) => {
    const [poll] = await tx
      .insert(pollsTable)
      .values({
        creatorId,
        title: body.title,
        description: body.description,
        isAnonymous: body.isAnonymous,
        expiresAt: new Date(body.expiresAt),
      })
      .returning({ id: pollsTable.id });

    for (const [i, q] of body.questions.entries()) {
      const [question] = await tx
        .insert(questionsTable)
        .values({
          pollId: poll!.id,
          text: q.text,
          isMandatory: q.isMandatory,
          order: i,
        })
        .returning({ id: questionsTable.id });

      await tx.insert(optionsTable).values(
        q.options.map((opt) => ({
          questionId: question!.id,
          text: opt,
        })),
      );
    }

    return { pollId: poll!.id };
  });
};

// ── GET POLL (public — for respondents to see questions) ─────
const getPoll = async (pollId: any) => {
  const [poll] = await db.select().from(pollsTable).where(eq(pollsTable.id, pollId));

  if (!poll) throw ApiError.notFound('Poll not found');

  const questions = await db.select().from(questionsTable).where(eq(questionsTable.pollId, pollId));

  // fetch options for each question
  const questionsWithOptions = await Promise.all(
    questions.map(async (q) => {
      const options = await db.select().from(optionsTable).where(eq(optionsTable.questionId, q.id));
      return { ...q, options };
    }),
  );

  return { ...poll, questions: questionsWithOptions };
};

// ── SUBMIT RESPONSE ──────────────────────────────────────────
// userId is optional — null means anonymous
const submitResponse = async (pollId: any, { answers }: SubmitResponseInput, userId?: string) => {
  const [poll] = await db.select().from(pollsTable).where(eq(pollsTable.id, pollId));

  if (!poll) throw ApiError.notFound('Poll not found');

  // Expiry check — most important business rule
  if (new Date() > poll.expiresAt) {
    throw ApiError.badRequest('This poll has expired');
  }

  // If poll requires auth and user isn't logged in, reject
  if (!poll.isAnonymous && !userId) {
    throw ApiError.unauthorized('This poll requires you to be logged in');
  }

  // Mandatory question check
  const questions = await db.select().from(questionsTable).where(eq(questionsTable.pollId, pollId));

  const mandatoryIds = questions.filter((q) => q.isMandatory).map((q) => q.id);

  const answeredQuestionIds = answers.map((a) => a.questionId);

  const unanswered = mandatoryIds.filter((id) => !answeredQuestionIds.includes(id));

  if (unanswered.length > 0) {
    throw ApiError.badRequest('Please answer all mandatory questions');
  }

  // Transaction starts here
  return await db.transaction(async (tx) => {
    const [response] = await tx
      .insert(responsesTable)
      .values({
        pollId,
        respondentId: userId ?? null,
      })
      .returning({
        id: responsesTable.id,
      });

    if (!response) {
      throw ApiError.dbError('Failed to create response');
    }

    await tx.insert(answersTable).values(
      answers.map((a) => ({
        responseId: response.id,
        questionId: a.questionId,
        optionId: a.optionId,
      })),
    );

    // Count inside the same transaction so the number is accurate
    const [total] = await tx
      .select({ total: count() })
      .from(responsesTable)
      .where(eq(responsesTable.pollId, pollId));

    const io = getIo();
    io.to(`poll:${pollId}`).emit('new-response', {
      pollId,
      totalResponses: total,
    });

    return { responseId: response.id };
  });
};

// ── ANALYTICS (creator only) ─────────────────────────────────
const getAnalytics = async (pollId: any, creatorId: string) => {
  const [poll] = await db.select().from(pollsTable).where(eq(pollsTable.id, pollId));

  if (!poll) throw ApiError.notFound('Poll not found');
  if (poll.creatorId !== creatorId) throw ApiError.forbidden('Not your poll');

  // Total responses
  const [total] = await db
    .select({ total: count() })
    .from(responsesTable)
    .where(eq(responsesTable.pollId, pollId));

  // Option counts per question — this is what the dashboard charts use
  const optionCounts = await db
    .select({
      questionId: answersTable.questionId,
      optionId: answersTable.optionId,
      count: count(),
    })
    .from(answersTable)
    .innerJoin(responsesTable, eq(answersTable.responseId, responsesTable.id))
    .where(eq(responsesTable.pollId, pollId))
    .groupBy(answersTable.questionId, answersTable.optionId);

  return { totalResponses: total, optionCounts };
};

// ── PUBLISH RESULTS ──────────────────────────────────────────
const publishResults = async (pollId: any, creatorId: string) => {
  const [poll] = await db.select().from(pollsTable).where(eq(pollsTable.id, pollId));

  if (!poll) throw ApiError.notFound('Poll not found');
  if (poll.creatorId !== creatorId) throw ApiError.forbidden('Not your poll');

  await db.update(pollsTable).set({ isPublished: true }).where(eq(pollsTable.id, pollId));

  return { message: 'Results published' };
};

const getMyPolls = async (creatorId: string) => {
  const polls = await db
    .select()
    .from(pollsTable)
    .where(eq(pollsTable.creatorId, creatorId))
    .orderBy(desc(pollsTable.createdAt));
 
  // Get response count per poll
  const pollsWithCounts = await Promise.all(
    polls.map(async (poll) => {
      const [total ] = await db
        .select({ total: count() })
        .from(responsesTable)
        .where(eq(responsesTable.pollId, poll.id));
 
      return {
        ...poll,
        _count: { responses: total?.total || 0 },
      };
    })
  );

  console.log(pollsWithCounts);
 
  return { polls: pollsWithCounts };
};

export { createPoll, getPoll, submitResponse, getAnalytics, publishResults, getMyPolls };
