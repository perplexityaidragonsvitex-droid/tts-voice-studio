import { spawn } from 'child_process';
import { join } from 'path';

const pythonPath = join(process.cwd(), '..', '..', 'tts-env', 'bin', 'python3');
const scriptPath = join(process.cwd(), 'index.py');

console.log('🐍 Starting Python TTS service...');
console.log('Python:', pythonPath);
console.log('Script:', scriptPath);

const python = spawn(pythonPath, [scriptPath], {
  stdio: 'inherit',
  env: { ...process.env }
});

python.on('error', (err) => {
  console.error('❌ Failed to start Python TTS service:', err);
  process.exit(1);
});

python.on('close', (code) => {
  console.log(`Python TTS service exited with code ${code}`);
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  python.kill('SIGINT');
});

process.on('SIGTERM', () => {
  python.kill('SIGTERM');
});
