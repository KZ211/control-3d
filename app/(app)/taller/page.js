import { cargar, piezasDeVentas } from '@/lib/datos';
import { fecha, hoy } from '@/lib/formato';
import { Pagina, Hoja, Explica } from '@/components/ui';
import FormImpresion from './form';

export const dynamic = 'force-dynamic';

export default async function Imprimir() {
  const d = await cargar();
  const maquinas = d.maquinas.map(({ id, nombre, consumo_watts, porHora }) => ({ id, nombre, consumo_watts, porHora }));
  // Nombre del lote: material y color, o la descripción con la fecha de compra.
  const lotes = d.stock.map(({ id, descripcion, material, color, fecha: dia, costoGramo, quedan }) => ({
    id,
    nombre: [material, color].filter(Boolean).join(' ') || `${descripcion} del ${fecha(dia)}`,
    costoGramo,
    quedan,
  }));
  const productos = d.productos.map(({ id, nombre, gramos_unidad, horas_unidad }) => ({
    id,
    nombre,
    gramos_unidad: Number(gramos_unidad),
    horas_unidad: horas_unidad == null ? null : Number(horas_unidad),
  }));

  return (
    <Pagina className="max-w-6xl">
      <Hoja className="p-5">
        <FormImpresion
          hoy={hoy()}
          maquinas={maquinas}
          lotes={lotes}
          piezas={piezasDeVentas(d)}
          productos={productos}
          precioKwh={d.ajustes.precioKwh}
          costoGramo={d.ajustes.costoGramo}
          multiplicador={d.ajustes.multiplicador}
          multiplicadorMayor={d.ajustes.multiplicadorMayor}
        />
        <Explica titulo="¿Cómo se calcula el costo?">
          <p>
            <strong>Filamento:</strong> gramos × lo que te costó cada gramo de ese lote. Sin lote, se usa el precio por gramo de Ajustes. El precio queda guardado: si
            después cambia el filamento, esta impresión no cambia.
          </p>
          <p>
            <strong>Luz:</strong> horas × consumo de la máquina en kW × precio del kWh. <strong>Desgaste:</strong> horas × (precio de la máquina ÷ horas de vida útil).
          </p>
          <p>
            <strong>Para qué es:</strong> si es para una venta, su costo pasa a esa venta. Si es <strong>stock</strong>, queda como piezas hechas hasta que la asignes a
            una venta. Lo que imprimís para vos, los regalos y las pruebas son gasto.
          </p>
        </Explica>
      </Hoja>
    </Pagina>
  );
}
