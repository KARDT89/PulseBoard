import type { Request, Response } from 'express';
import ApiResponse from '../utils/api-response.js';
import * as pollService from './services.js';

const createPoll = async (req: Request, res: Response) => {
  const poll = await pollService.createPoll(req.user.id, req.body);
  ApiResponse.created(res, 'Poll created', poll);
};

const getPoll = async (req: Request, res: Response) => {
    const { pollId } = req.params;
  const poll = await pollService.getPoll(pollId);
  ApiResponse.ok(res, 'Poll fetched', poll);
};

const submitResponse = async (req: Request, res: Response) => {
  // userId is optional — if not logged in, it's undefined
  const userId = req.user?.id;
  const result = await pollService.submitResponse(
    req.params.pollId,
    req.body,
    userId
  );
  ApiResponse.created(res, 'Response submitted', result);
};

const getAnalytics = async (req: Request, res: Response) => {
  const analytics = await pollService.getAnalytics(
    req.params.pollId,
    req.user.id
  );
  ApiResponse.ok(res, 'Analytics fetched', analytics);
};

const publishResults = async (req: Request, res: Response) => {
  const result = await pollService.publishResults(
    req.params.pollId,
    req.user.id
  );
  ApiResponse.ok(res, 'Results published', result);
};

const getMyPolls = async (req: Request, res: Response) => {
  const polls = await pollService.getMyPolls(req.user.id);
  ApiResponse.ok(res, 'Polls fetched', polls);
};
 

export { createPoll, getPoll, submitResponse, getAnalytics, publishResults, getMyPolls };