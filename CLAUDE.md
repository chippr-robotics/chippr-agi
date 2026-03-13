# chippr-agi v2

A modern TypeScript ECS agent framework. Ground-up rewrite of chippr-robotics/chippr-agi.

## Architecture

- **ECS core** (`src/ecs/`): Entities, Components, Systems, and a typed EventBus
- **Model providers** (`src/model/`): Claude API (primary) + OpenAI-compatible local models (BitNet/Ollama/llama.cpp)
- **Storage** (`src/store/`): SQLite via better-sqlite3 (entities, components, events, memory)
- **Systems** (`src/systems/`): Self-registering ECS systems (task generation, routing, judging, scheduling)
- **Container isolation** (`src/container/`): Docker/Apple Container per agent context

## Key Commands

```bash
npm start                    # Run with tsx
npm run dev                  # Watch mode
npm test                     # Vitest test suite
npm run build                # TypeScript compilation
npm start -- "objective"     # Submit an objective via CLI
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `CHIPPR_MODEL_PROVIDER` | `claude` | `claude` or `local` |
| `CHIPPR_CLAUDE_MODEL` | `sonnet` | Claude model name |
| `CHIPPR_LOCAL_URL` | `http://localhost:11434/v1` | Local model API URL |
| `CHIPPR_LOCAL_MODEL` | `bitnet-b1.58` | Local model name |
| `CHIPPR_DB_PATH` | `./chippr.db` | SQLite database path |
| `CHIPPR_CONTAINER_RUNTIME` | `docker` | `docker` or `apple-container` |
| `CHIPPR_CONTAINER_IMAGE` | `chippr-agent:latest` | Agent container image |
| `CHIPPR_LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `ANTHROPIC_API_KEY` | — | Required for Claude provider |

## Design Principles

1. One opinion per concern — no switch-statement abstractions
2. Auditable in an afternoon — target ≤600 lines core logic
3. ECS is the skeleton — everything is an Entity, Component, or System
4. Container-first isolation — each agent context runs isolated
5. Skills over features — extend via `.claude/skills/`, not merged PRs
