# GameLab Scripts

This directory contains utility scripts for managing the GameLab application.

## Available Scripts

### `update-game-slugs.ts`

This script updates all existing games in the database to have a slug field. It should be run once to migrate existing data.

#### Usage

```bash
# Install ts-node if you don't have it
npm install -g ts-node

# Run the script
ts-node src/scripts/update-game-slugs.ts
```

## Adding New Scripts

When adding new scripts to this directory:

1. Create a new TypeScript file with a descriptive name
2. Add documentation at the top of the file explaining what the script does
3. Update this README with information about the new script
4. Include usage instructions in the script and README
