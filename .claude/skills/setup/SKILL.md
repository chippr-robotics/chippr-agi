# Setup Skill

Guides initial setup of a chippr-agi v2 instance.

## Steps

1. Verify Node.js >= 20 is installed
2. Run `npm install` to install dependencies
3. Copy `.env.example` to `.env` and configure:
   - Set `ANTHROPIC_API_KEY` for Claude provider
   - Or set `CHIPPR_MODEL_PROVIDER=local` with `CHIPPR_LOCAL_URL` for local models
4. Run `npm test` to verify installation
5. Run `npm start` to launch the agent
