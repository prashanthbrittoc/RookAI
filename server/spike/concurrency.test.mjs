import { mapLimit } from './concurrency.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('never exceeds the limit and keeps input order', async () => {
  let running = 0, peak = 0;
  const res = await mapLimit([1, 2, 3, 4, 5, 6], 2, async (n) => {
    running++; peak = Math.max(peak, running);
    await sleep(10);
    running--;
    return n * 2;
  });
  expect(peak).toBeLessThanOrEqual(2);
  expect(res.map((r) => r.value)).toEqual([2, 4, 6, 8, 10, 12]);
});

test('one failure does not stop the others', async () => {
  const res = await mapLimit([1, 2, 3], 2, async (n) => {
    if (n === 2) throw new Error('boom');
    return n;
  });
  expect(res.map((r) => r.ok)).toEqual([true, false, true]);
});