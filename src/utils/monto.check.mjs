// Self-check: node src/utils/monto.check.mjs
import assert from 'node:assert/strict'
import { limpiarMonto, limpiarEntero } from './monto.js'

for (const [entrada, esperado] of [
  ['16.57', '16.57'], ['$16.57', '16.57'], ['US$ 2.32', '2.32'], ['13,67', '13.67'],
  ['1,234.56', '1234.56'], ['abc', ''], ['12a', '12'], ['1.234', '1.23'], ['1.', '1.'],
  ['.5', '.5'], ['', ''], [null, ''],
]) assert.equal(limpiarMonto(entrada), esperado, entrada)
assert.equal(limpiarEntero('17a'), '17')
console.log('ok')
