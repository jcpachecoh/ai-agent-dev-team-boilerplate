import {
  Injectable,
  Inject,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { Version3Client } from 'jira.js';
import { GenerationRepository } from '../repository/generation.repository';
import type {
  IGenerationService,
  GenerationPreview,
  ConfirmGenerationResult,
  IssueContext,
} from '../interfaces/generation.interfaces';

export const JIRA_CLIENT = 'JIRA_CLIENT';

const PRIORITY_MAP: Record<number, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
  0: 'MEDIUM',
  1: 'CRITICAL',
  2: 'HIGH',
  3: 'MEDIUM',
  4: 'LOW',
};

const generationSchema = z.object({
  milestone: z
    .object({
      name: z.string(),
      description: z.string(),
      dueDate: z.string().optional(),
    })
    .optional(),
  requirements: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      externalId: z.string(),
    }),
  ),
  testCases: z.array(
    z.object({
      title: z.string(),
      preconditions: z.string(),
      steps: z.string(),
      expectedResult: z.string(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      type: z.enum(['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE']),
    }),
  ),
});

@Injectable()
export class GenerationService implements IGenerationService {
  constructor(
    @Inject(JIRA_CLIENT) private readonly jiraClient: Version3Client | null,
    private readonly generationRepository: GenerationRepository,
  ) {}

  async generate(projectId: string, issueKey: string): Promise<GenerationPreview> {
    if (!this.jiraClient) {
      throw new ServiceUnavailableException(
        'Jira integration is not configured. Set JIRA_URL, JIRA_USERNAME and JIRA_API_TOKEN.',
      );
    }
    const raw = await this.jiraClient.issues.getIssue({ issueIdOrKey: issueKey });

    const description = extractAdfText(raw.fields.description);
    if (!description.trim()) {
      throw new UnprocessableEntityException(
        `Jira issue ${issueKey} has no description — cannot generate test artifacts.`,
      );
    }

    const issue: IssueContext = {
      identifier: raw.key,
      title: raw.fields.summary,
      description,
      priority: mapJiraPriority(raw.fields.priority?.name),
      labels: (raw.fields.labels as string[]) ?? [],
    };

    const priority = PRIORITY_MAP[issue.priority] ?? 'MEDIUM';
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

    const { object } = await generateObject({
      model: openai(model),
      schema: generationSchema,
      maxOutputTokens: 2048,
      messages: [
        {
          role: 'system',
          content: `You are a QA engineer assistant. Given a Jira issue, generate a structured test plan.
Output exactly the JSON schema described. Rules:
- Extract acceptance criteria bullets from the description as "requirements" entries. Set externalId to the issue identifier (e.g. "${issue.identifier}").
- Generate 2–5 test cases covering happy path, edge cases, and error scenarios.
- Priority mapping: 0=No priority→MEDIUM, 1=Urgent→CRITICAL, 2=High→HIGH, 3=Medium→MEDIUM, 4=Low→LOW. Default is "${priority}".
- If the issue mentions a sprint or target date, create a milestone. Otherwise omit it.
- For test case "type": use ACCEPTANCE for acceptance criteria, FUNCTIONAL for happy path, REGRESSION for edge cases, SMOKE for critical paths.
- The "steps" field should be a newline-separated list of numbered steps.`,
        },
        {
          role: 'user',
          content: `Issue: ${issue.identifier} — ${issue.title}\n\nDescription:\n${issue.description}\n\nLabels: ${issue.labels.join(', ')}`,
        },
      ],
    });

    return object;
  }

  async confirm(
    projectId: string,
    suiteId: string,
    createdById: string,
    preview: GenerationPreview,
  ): Promise<ConfirmGenerationResult> {
    return this.generationRepository.confirmGeneration({
      projectId,
      suiteId,
      createdById,
      preview,
    });
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function extractAdfText(adf: unknown): string {
  if (!adf || typeof adf !== 'object') return String(adf ?? '');
  const node = adf as { type?: string; text?: string; content?: unknown[] };
  if (node.type === 'text') return node.text ?? '';
  if (Array.isArray(node.content)) {
    return node.content.map(extractAdfText).join(node.type === 'paragraph' ? '\n\n' : '');
  }
  return '';
}

const JIRA_PRIORITY_MAP: Record<string, number> = {
  Highest: 1,
  High: 2,
  Medium: 3,
  Low: 4,
  Lowest: 4,
};

function mapJiraPriority(name?: string): number {
  return JIRA_PRIORITY_MAP[name ?? ''] ?? 0;
}
