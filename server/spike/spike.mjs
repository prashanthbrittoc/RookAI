import { spawn } from "child_process"

const ENGINE = process.argv[2];
const engine = spawn('node', [ENGINE]);

engine.stdout.on('data', (d) => {
  const text = d.toString();
  console.log(text);
  if (text.includes('bestmove')) send('quit');
});
engine.stderr.on('data', (d) => console.error(d.toString()));

const send = (cmd) => engine.stdin.write(cmd + '\n');

send('uci');
send('isready');
send('position fen rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1');
send('go depth 20');