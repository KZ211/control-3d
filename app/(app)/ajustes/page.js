import { cargar } from '@/lib/datos';
import { plata, plataFina } from '@/lib/formato';
import { Pagina, Hoja, Campo, Explica } from '@/components/ui';
import { Formulario, Enviar } from '@/components/formulario';
import { guardarAjustes } from '@/app/acciones';

export const dynamic = 'force-dynamic';

export default async function Ajustes() {
  const d = await cargar();
  const { costoGramo, multiplicador, multiplicadorMayor, reinversionPct, precioKwh } = d.ajustes;
  // Precio por gramo promedio del filamento que queda, para comparar.
  const gramosStock = d.stock.reduce((s, l) => s + l.quedan, 0);
  const promedio = gramosStock ? d.stock.reduce((s, l) => s + l.valor, 0) / gramosStock : 0;

  return (
    <Pagina className="max-w-3xl">
      <p className="text-sm text-tenue">Las reglas de tu planilla, para que la app calcule igual que vos.</p>
      <Hoja className="p-5">
        <Formulario accion={guardarAjustes} limpiar={false} className="grid gap-4 sm:grid-cols-2">
          <Campo
            nombre="Precio por gramo de filamento"
            ayuda={`Se usa cuando una pieza no sale de un lote cargado. La planilla usa $18 y $20.${promedio ? ` El filamento que tenés en stock promedia ${plataFina(promedio)}.` : ''}`}
          >
            <input name="costo_gramo" inputMode="decimal" defaultValue={costoGramo} className="entrada" />
          </Campo>
          <Campo nombre="Multiplicador para el precio" ayuda="Precio sugerido = costo del filamento × este número. La planilla empezó con ×3 y ahora usa ×5.">
            <input name="multiplicador" inputMode="decimal" defaultValue={multiplicador} className="entrada" />
          </Campo>
          <Campo nombre="Multiplicador por mayor" ayuda="Para pedidos grandes o reventa: por ejemplo ×4 o ×4,5. Se muestra al lado del precio sugerido.">
            <input name="multiplicador_mayor" inputMode="decimal" defaultValue={multiplicadorMayor} className="entrada" />
          </Campo>
          <Campo nombre="Parte de cada venta para reinvertir (%)" ayuda="Lo que apartás para volver a comprar filamento. En la planilla es 34% (el neto es el 66%).">
            <input name="reinversion_pct" inputMode="decimal" defaultValue={reinversionPct} className="entrada" />
          </Campo>
          <Campo nombre="Precio del kWh" ayuda="En tu factura de luz: el total a pagar dividido los kWh consumidos da un buen promedio.">
            <input name="precio_kwh" inputMode="decimal" defaultValue={precioKwh} className="entrada" />
          </Campo>
          <Enviar className="btn btn-primary min-h-11 sm:col-span-2">Guardar</Enviar>
        </Formulario>
        <Explica titulo="¿Qué multiplicador poner?">
          <p>
            El multiplicador se aplica solo al filamento, pero el precio tiene que pagar mucho más: la luz, el desgaste de la impresora, las piezas que
            salen mal, tu tiempo (diseñar, sacar soportes, atender al cliente) y la ganancia.
          </p>
          <p>
            Con ×5, una pieza de 75 g a {plata(costoGramo)} el gramo cuesta {plata(75 * costoGramo)} de filamento y el precio sugerido es{' '}
            {plata(75 * costoGramo * 5)}; por mayor, con ×{String(multiplicadorMayor).replace('.', ',')}, {plata(75 * costoGramo * multiplicadorMayor)} cada una. Las piezas chicas y rápidas aguantan multiplicadores más altos; las grandes, más bajos.
          </p>
        </Explica>
      </Hoja>
    </Pagina>
  );
}
