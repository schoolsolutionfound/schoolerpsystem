const { spawn } = require('child_process');

const proc = spawn('npx', ['drizzle-kit', 'generate'], {
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe']
});

proc.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  if (output.includes('?')) {
    proc.stdin.write('\r\n');
  }
});

proc.stderr.on('data', (data) => {
  process.stderr.write(data);
});

proc.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
  process.exit(code);
});
