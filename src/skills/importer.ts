import type { SkillRecord, ToolStep } from '../core/components.js';
import { uniqueId } from '../util/hash.js';

/**
 * Parses an agentskills.io markdown skill document into a SkillRecord.
 * Expects frontmatter-style YAML or markdown sections with:
 * - Name, Description, Preconditions, Steps, Success Criteria
 */
export function importSkillFromMarkdown(markdown: string): SkillRecord {
  const name = extractSection(markdown, 'name') ?? extractHeading(markdown) ?? 'imported-skill';
  const description = extractSection(markdown, 'description') ?? '';
  const preconditions = extractList(markdown, 'preconditions');
  const steps = extractSteps(markdown);
  const successCriteria = extractSection(markdown, 'success criteria') ?? '';
  const failureModes = extractList(markdown, 'failure modes');

  return {
    id: uniqueId(),
    name,
    description,
    preconditions,
    toolSequence: steps,
    successCriteria,
    failureModes,
    successCount: 0,
    failureCount: 0,
    avgReward: 0.5, // neutral starting reward for imported skills
    source: 'agentskills.io',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Fetches a skill from a remote URL and imports it.
 */
export async function fetchAndImportSkill(url: string): Promise<SkillRecord> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch skill from ${url}: ${response.status}`);
  const markdown = await response.text();
  return importSkillFromMarkdown(markdown);
}

function extractHeading(md: string): string | null {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function extractSection(md: string, sectionName: string): string | null {
  const regex = new RegExp(`##\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
  const match = md.match(regex);
  return match ? match[1].trim() : null;
}

function extractList(md: string, sectionName: string): string[] {
  const section = extractSection(md, sectionName);
  if (!section) return [];
  return section
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

function extractSteps(md: string): ToolStep[] {
  const section = extractSection(md, 'steps') ?? extractSection(md, 'tool sequence');
  if (!section) return [];

  return section
    .split('\n')
    .map((line) => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
    .map((step) => ({
      toolName: 'generic',
      parameters: {},
      description: step,
    }));
}
