import { z } from 'zod';

export const scoreSchema = z.number().min(0).max(100);

export const evaluationResultSchema = z.object({
  overallScore: scoreSchema,
  categoryScores: z.record(z.string(), scoreSchema),
  summary: z.string().min(1).max(5000),
  strengths: z.array(z.string().min(1)).max(10),
  improvements: z.array(z.string().min(1)).max(10),
  improvedAnswer: z.string().max(20000),
  nextExercise: z.string().max(5000).optional(),
}).strict();

export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

const suggestionTypeSchema = z.enum(['tip', 'warning', 'refactor']);

export const standupResponseSchema = evaluationResultSchema.extend({
  categoryScores: z.object({
    clarity: scoreSchema,
    conciseness: scoreSchema,
    impact: scoreSchema,
  }).strict(),
});

export type StandupEvaluation = z.infer<typeof standupResponseSchema>;

export const writingSuggestionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: suggestionTypeSchema,
  original_text: z.string(),
  replacement_text: z.string(),
}).strict();

export const writingResponseSchema = evaluationResultSchema.extend({
  categoryScores: z.object({
    clarity: scoreSchema,
    structure: scoreSchema,
    tone: scoreSchema,
    completeness: scoreSchema,
    terminology: scoreSchema,
  }).strict(),
  suggestions: z.array(writingSuggestionSchema).length(3),
});

export type WritingEvaluation = z.infer<typeof writingResponseSchema>;

export const interviewResponseSchema = evaluationResultSchema.extend({
  categoryScores: z.object({
    technicalAccuracy: scoreSchema,
    depth: scoreSchema,
    clarity: scoreSchema,
    communication: scoreSchema,
    terminology: scoreSchema,
  }).strict(),
  technicalScore: scoreSchema,
  communicationScore: scoreSchema,
  recommendedPhrasing: z.string().min(1).max(20000),
});

export type InterviewEvaluation = z.infer<typeof interviewResponseSchema>;

const codeSuggestionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: suggestionTypeSchema,
  icon: z.enum(['lightbulb', 'warning', 'auto_fix_high']),
}).strict();

const codeReviewFeedbackSchema = z.object({
  summary: z.string().min(1).max(5000),
  strengths: z.array(z.string().min(1)).max(10),
  improvements: z.array(z.string().min(1)).max(10),
  improvedAnswer: z.string().min(1).max(30000),
  suggestions: z.array(codeSuggestionSchema).length(3),
});

export const reviewerResponseSchema = codeReviewFeedbackSchema.extend({
  constructiveness: scoreSchema,
  specificity: scoreSchema,
  tone: scoreSchema,
}).strict();

export const authorResponseSchema = codeReviewFeedbackSchema.extend({
  correctness: scoreSchema,
  readability: scoreSchema,
  bestPractices: scoreSchema,
}).strict();

export type ReviewerCodeReviewEvaluation = z.infer<typeof reviewerResponseSchema>;
export type AuthorCodeReviewEvaluation = z.infer<typeof authorResponseSchema>;

const communicationTipSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['tip', 'warning']),
}).strict();

const pairProgrammingFeedbackSchema = z.object({
  summary: z.string().min(1).max(5000),
  strengths: z.array(z.string().min(1)).max(10),
  improvements: z.array(z.string().min(1)).max(10),
  improvedAnswer: z.string().min(1).max(30000),
  communication_tips: z.array(communicationTipSchema),
});

export const driverResponseSchema = pairProgrammingFeedbackSchema.extend({
  correctness: scoreSchema,
  efficiency: scoreSchema,
  readability: scoreSchema,
}).strict();

export const navigatorResponseSchema = pairProgrammingFeedbackSchema.extend({
  clarity: scoreSchema,
  effectiveness: scoreSchema,
  precision: scoreSchema,
  generatedCode: z.string(),
}).strict();

export type DriverPairProgrammingEvaluation = z.infer<typeof driverResponseSchema>;
export type NavigatorPairProgrammingEvaluation = z.infer<typeof navigatorResponseSchema>;
