'use client';

import { useFormState } from 'react-dom';
import { entrar } from '../acciones';
import { Enviar } from '@/components/formulario';

export default function FormLogin() {
  const [estado, accion] = useFormState(entrar, null);
  return (
    <form action={accion} className="mt-8 space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Email</span>
        <input name="email" type="email" autoComplete="email" required className="entrada" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Contraseña</span>
        <input name="password" type="password" autoComplete="current-password" required className="entrada" />
      </label>
      {estado?.error && (
        <p role="alert" className="text-sm font-medium text-pierde">
          {estado.error}
        </p>
      )}
      <Enviar className="boton w-full">Entrar</Enviar>
    </form>
  );
}
