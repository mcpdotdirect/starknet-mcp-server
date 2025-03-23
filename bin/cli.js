#!/usr/bin/env node

import { startServer } from '../build/index.js';

const args = process.argv.slice(2);
const mode = args[0]?.toLowerCase();

if (mode === 'http') {
  // If the HTTP server module exists, import and run it
  import('../build/http-server.js')
    .catch(error => {
      console.error('Error starting HTTP server:', error);
      process.exit(1);
    });
} else {
  // Default to stdio server
  startServer()
    .catch(error => {
      console.error('Error starting stdio server:', error);
      process.exit(1);
    });
} 