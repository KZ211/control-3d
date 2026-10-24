import FormLogin from './form';

export const metadata = { title: 'Entrar · Control 3D' };

export default function Login() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <p className="text-2xl font-bold tracking-tight">
        Control <span className="text-acento">3D</span>
      </p>
      <p className="mt-2 text-tenue">Ventas, costos y lo que falta para recuperar tus máquinas.</p>
      <FormLogin />
    </main>
  );
}
