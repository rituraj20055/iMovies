const { spawn } = require('child_process');
const path = require('path');

console.log('🎬 Starting iMovies Full-Stack Platform...\n');

const serverProc = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'server'),
  shell: true,
  stdio: 'inherit'
});

const clientProc = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  shell: true,
  stdio: 'inherit'
});

const cleanup = () => {
  console.log('\n🛑 Shutting down iMovies services...');
  serverProc.kill();
  clientProc.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
