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

  if (new Date() > poll.expiresAt) {
    throw ApiError.badRequest('This poll has expired');
  }

  if (!poll.isAnonymous && !userId) {
    throw ApiError.unauthorized('This poll requires you to be logged in');
  }

  const questions = await db.select().from(questionsTable).where(eq(questionsTable.pollId, pollId));

  const mandatoryIds = questions.filter((q) => q.isMandatory).map((q) => q.id);
  const answeredQuestionIds = answers.map((a) => a.questionId);
  const unanswered = mandatoryIds.filter((id) => !answeredQuestionIds.includes(id));

  if (unanswered.length > 0) {
    throw ApiError.badRequest('Please answer all mandatory questions');
  }

  return await db.transaction(async (tx) => {
    const [response] = await tx
      .insert(responsesTable)
      .values({
        pollId,
        respondentId: userId ?? null,
      })
      .returning({ id: responsesTable.id });

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

    const [total] = await tx
      .select({ total: count() })
      .from(responsesTable)
      .where(eq(responsesTable.pollId, pollId));

    // fetch updated option counts for live results
    const optionCounts = await tx
      .select({
        optionId: answersTable.optionId,
        count: count(),
      })
      .from(answersTable)
      .innerJoin(responsesTable, eq(answersTable.responseId, responsesTable.id))
      .where(eq(responsesTable.pollId, pollId))
      .groupBy(answersTable.optionId);

    const io = getIo();

    // emit to poll room — respond page + results page listeners
    io.to(`poll:${pollId}`).emit('new-response', {
      pollId,
      totalResponses: total?.total ?? 0,
      optionCounts, // [{ optionId, count }]
    });

    // emit to global feed room — explore page listener
    io.to('feed').emit('feed-activity', {
      pollId,
      pollTitle: poll.title,
      totalResponses: total?.total ?? 0,
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

  await db.update(pollsTable).set({ isPublished: true, expiresAt: new Date() }).where(eq(pollsTable.id, pollId));

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
 
  return { polls: pollsWithCounts };
};

const getResults = async (pollId: any) => {
  const [poll] = await db.select().from(pollsTable).where(eq(pollsTable.id, pollId));

  if (!poll) throw ApiError.notFound('Poll not found');
  if (!poll.isPublished) throw ApiError.forbidden('Results not published yet');

  const questions = await db.select().from(questionsTable).where(eq(questionsTable.pollId, pollId));

  const questionsWithOptions = await Promise.all(
    questions.map(async (q) => {
      const options = await db.select().from(optionsTable).where(eq(optionsTable.questionId, q.id));
      return { ...q, options };
    }),
  );

  // Count votes per option (via answers → responses)
  const optionCounts = await db
    .select({
      optionId: answersTable.optionId,
      count: count(),
    })
    .from(answersTable)
    .innerJoin(responsesTable, eq(answersTable.responseId, responsesTable.id))
    .where(eq(responsesTable.pollId, pollId))
    .groupBy(answersTable.optionId);

  const countMap = Object.fromEntries(optionCounts.map((r) => [r.optionId, r.count]));

  const [total] = await db
    .select({ total: count() })
    .from(responsesTable)
    .where(eq(responsesTable.pollId, pollId));

  const results = questionsWithOptions
    .sort((a, b) => a.order - b.order)
    .map((q) => ({
      id: q.id,
      text: q.text,
      order: q.order,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        count: countMap[opt.id] ?? 0,
      })),
    }));

  return {
    poll: {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      isAnonymous: poll.isAnonymous,
      isPublished: poll.isPublished,
      expiresAt: poll.expiresAt,
      _count: { responses: total?.total ?? 0 },
    },
    results,
  };
};

const deletePoll = async (pollId: any, creatorId: string) => {
  const [poll] = await db.select().from(pollsTable).where(eq(pollsTable.id, pollId))

  if (!poll) throw ApiError.notFound('Poll not found')
  if (poll.creatorId !== creatorId) throw ApiError.forbidden('Not your poll')

  await db.delete(pollsTable).where(eq(pollsTable.id, pollId))

  return { pollId }
}

const getPublicPolls = async (page: number = 1, sort: 'newest' | 'popular' = 'newest') => {
  const limit = 10
  const offset = (page - 1) * limit

  const allPolls = await db
    .select()
    .from(pollsTable)
    .where(eq(pollsTable.isPublished, false)) // only live polls, not closed/published
    .orderBy(sort === 'newest' ? desc(pollsTable.createdAt) : desc(pollsTable.id))
    .limit(limit)
    .offset(offset)

  const pollsWithCounts = await Promise.all(
    allPolls.map(async (poll) => {
      const [total] = await db
        .select({ total: count() })
        .from(responsesTable)
        .where(eq(responsesTable.pollId, poll.id))

      return {
        ...poll,
        _count: { responses: total?.total ?? 0 },
      }
    })
  )

  const [totalCount] = await db
    .select({ total: count() })
    .from(pollsTable)
    .where(eq(pollsTable.isPublished, false))

  return {
    polls: pollsWithCounts,
    pagination: {
      page,
      limit,
      total: totalCount?.total ?? 0,
      totalPages: Math.ceil((totalCount?.total ?? 0) / limit),
    },
  }
}

export { createPoll, getPoll, submitResponse, getAnalytics, publishResults, getMyPolls, getResults, deletePoll, getPublicPolls };
