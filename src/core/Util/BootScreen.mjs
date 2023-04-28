import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function getPackageVersion() {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  try {
    const data = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(data);
    return packageJson.version;
  } catch (error) {
    console.error('Error reading package.json:', error);
    return 'unknown';
  }
}

export function displayBootScreen(version, config) {
    if (config.CORE.QUIET_BOOT === '1') {
      return;
    }
  
    const asciiArt = `
   ________    _                  ___   __________
  / ____/ /_  (_)___  ____  _____/   | / ____/  _/
 / /   / __ \\/ / __ \\/ __ \\/ ___/ /| |/ / __ / /  
/ /___/ / / / / /_/ / /_/ / /  / ___ / /_/ // /   
\\____/_/ /_/_/ .___/ .___/_/  /_/  |_\\____/___/   
             /_/   /_/                             
    `;
    console.log(asciiArt);
    console.log(`Version: ${version}`);
    console.log(`Selected Systems:`);
    console.log(`  VectorDB: ${config.VECTORDB.VECTORDB_TYPE}`);
    console.log(`  LanguageModel: ${config.LANGUAGE_MODEL.LANGUAGE_MODEL_ID}`)
    console.log(`  Message Bus: ${config.MESSAGE_BUS.MESSAGE_BUS_TYPE}`);
    console.log(`  Console Logs: ${config.LOGS.LOG_CONSOLE == true}`);
    console.log(`  Debug mode: ${config.LOGS.DEBUG == true}`);
    console.log(os.EOL);
  };

 