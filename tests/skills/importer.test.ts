import { describe, it, expect } from 'vitest';
import { importSkillFromMarkdown } from '../../src/skills/importer.js';

describe('Skill Importer', () => {
  it('parses a full skill markdown document', () => {
    const markdown = `# Deploy Service

## Description
Deploys a service to the production cluster.

## Preconditions
- Service is built and tested
- Cluster is accessible

## Steps
1. Build container image
2. Push to registry
3. Update deployment manifest
4. Apply to cluster

## Success Criteria
Service responds to health check within 60 seconds.

## Failure Modes
- Registry push timeout
- Cluster unreachable
- Health check fails
`;

    const skill = importSkillFromMarkdown(markdown);

    expect(skill.name).toBe('Deploy Service');
    expect(skill.description).toContain('Deploys a service');
    expect(skill.preconditions).toHaveLength(2);
    expect(skill.preconditions[0]).toBe('Service is built and tested');
    expect(skill.toolSequence).toHaveLength(4);
    expect(skill.toolSequence[0].description).toBe('Build container image');
    expect(skill.successCriteria).toContain('health check');
    expect(skill.failureModes).toHaveLength(3);
    expect(skill.source).toBe('agentskills.io');
    expect(skill.avgReward).toBe(0.5);
  });

  it('handles minimal markdown with just a heading', () => {
    const markdown = `# Simple Skill\nDoes something.`;

    const skill = importSkillFromMarkdown(markdown);
    expect(skill.name).toBe('Simple Skill');
    expect(skill.toolSequence).toHaveLength(0);
  });

  it('handles empty markdown gracefully', () => {
    const skill = importSkillFromMarkdown('');
    expect(skill.name).toBe('imported-skill');
    expect(skill.source).toBe('agentskills.io');
  });
});
