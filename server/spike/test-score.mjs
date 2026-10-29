import assert from "assert"
import { scoreToCp, moveLoss } from './score.mjs'

assert.strictEqual(scoreToCp({ type: 'cp', value: 250 }), 250)
assert.strictEqual(scoreToCp({ type: 'cp', value: 5000 }), 1000)
assert.strictEqual(scoreToCp({ type: 'mate', value: 3 }), 1000)
assert.strictEqual(scoreToCp({ type: 'mate', value: -2 }), -1000)
assert.strictEqual(scoreToCp({ type: 'mate', value: 0 }), -1000)

assert.strictEqual(moveLoss(30, -30), 0)
assert.strictEqual(moveLoss(30, 900), 930)
assert.strictEqual(moveLoss(0, -50), 0)
console.log('All tests passed')