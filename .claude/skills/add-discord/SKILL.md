# Add Discord I/O Skill

Transforms the chippr-agi codebase to add Discord as an input/output channel.

## Implementation

1. Add a `DiscordSystem` in `src/systems/discord.ts`
2. Use discord.js library
3. The system listens for messages in configured channels and creates entities with `TaskDescription` components
4. Responses are sent back to the originating channel when `task:completed` events fire
5. Memory is persisted per-channel using the `memory` table with `context_id` = channel ID
