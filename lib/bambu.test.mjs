import { test } from 'node:test';
import assert from 'node:assert/strict';
import { limpiarToken, venceToken, desdeTarea, gramosPorFilamento, estadoDe } from './bambu.js';

const jwt = (payload) => ['e30', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'firma'].join('.');

test('limpiar el token pegado de la cookie', () => {
  assert.equal(limpiarToken('  token=abc.def.ghi; '), 'abc.def.ghi');
  assert.equal(limpiarToken('"abc.def.ghi"'), 'abc.def.ghi');
  assert.equal(limpiarToken('abc'), 'abc');
});

test('cuándo vence el token', () => {
  assert.equal(venceToken(jwt({ exp: 1800000000 })), new Date(1800000000 * 1000).toISOString());
  assert.equal(venceToken(jwt({})), null);
  assert.equal(venceToken('no-es-un-jwt'), null);
});

test('una tarea de Bambu como fila de la app', () => {
  const fila = desdeTarea({
    id: 123,
    title: 'Llavero dragón',
    designTitle: 'Dragon keychain',
    plateIndex: 2,
    startTime: '2026-10-20T13:00:00Z',
    endTime: '2026-10-20T14:30:00Z',
    costTime: 5400.4,
    weight: 35.5,
    status: 2,
    deviceId: 'SERIE1',
    deviceName: 'X1C casa',
    amsDetailMapping: [
      { filamentType: 'PLA', sourceColor: 'FF0000FF', weight: 30 },
      { filamentType: 'PLA', sourceColor: '000000FF', weight: 5.5 },
      { filamentType: 'PETG', sourceColor: 'FFFFFFFF', weight: 0 },
    ],
  });
  assert.equal(fila.tarea_id, 123);
  assert.equal(fila.placa, 'Placa 2');
  assert.equal(fila.segundos, 5400);
  assert.equal(fila.filamentos.length, 2);
  assert.deepEqual(gramosPorFilamento(fila), [30, 5.5]);
  assert.equal(estadoDe(fila.estado), 'Terminó');
});

test('sin detalle del AMS, todo el peso en un filamento', () => {
  assert.deepEqual(gramosPorFilamento({ gramos: 12, filamentos: [] }), [12]);
  assert.deepEqual(gramosPorFilamento({ gramos: 0, filamentos: [] }), []);
  assert.equal(estadoDe(9), 'Estado 9');
});
