import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizar, mismoCliente, buscarClientes, posiblesRepetidos } from './nombres.js';

const clientes = ['Luk Tech', 'Lucía prima', 'Tio jorge', 'Holy cel', 'Lean', 'Leandro'].map((nombre, i) => ({ id: String(i), nombre }));

test('normalizar ignora mayúsculas, tildes y espacios', () => {
  assert.equal(normalizar('  Lucía   PRIMA '), 'lucia prima');
});

test('mismo cliente con errores chicos o escrito distinto', () => {
  assert.ok(mismoCliente('Luca tech', 'Luk Tech'));
  assert.ok(mismoCliente('Marcos holycel', 'Holy cel'));
  assert.ok(mismoCliente('lucia prima', 'Lucía Prima'));
  assert.ok(!mismoCliente('Lean', 'Juan'));
  assert.ok(!mismoCliente('Tio jorge', 'Tia Nancy'));
});

test('buscar mientras se escribe', () => {
  assert.equal(buscarClientes('lucia prima', clientes).exacto.nombre, 'Lucía prima');
  assert.deepEqual(
    buscarClientes('lea', clientes).sugeridos.map((c) => c.nombre),
    ['Lean', 'Leandro']
  );
  assert.equal(buscarClientes('Luca tech', clientes).sugeridos[0].nombre, 'Luk Tech');
  assert.equal(buscarClientes('Zoe', clientes).sugeridos.length, 0);
});

test('detecta parejas repetidas', () => {
  const parejas = posiblesRepetidos([...clientes, { id: 'x', nombre: 'Luca tech' }]).map(([a, b]) => [a.nombre, b.nombre].sort().join(' / '));
  assert.ok(parejas.includes('Luca tech / Luk Tech'));
});
