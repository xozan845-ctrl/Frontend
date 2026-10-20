/**
 * Wrapper de compatibilidad. `npm run rules:check` invoca este archivo; delega
 * en el CLI (`cli.mjs rules`).
 */
import { main } from './cli.mjs';

process.exitCode = await main(['rules']);
