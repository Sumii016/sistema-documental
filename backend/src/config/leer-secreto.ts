import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function leerSecreto(variable: string): string {
  // busca en el .env la variable que contiene la ruta del secreto
  const ruta = process.env[variable];
  if (!ruta) {
    throw new Error(`Falta la variable ${variable} en el .env`);
  }

  // convierte la ruta relativa a absoluta para poder leer el archivo
  const rutaCompleta = resolve(process.cwd(), ruta);

  // lee el archivo y quita espacios o saltos de linea sobrantes
  let valor: string;
  try {
    valor = readFileSync(rutaCompleta, 'utf-8').trim();
  } catch (error) {
    throw new Error(`No se pudo leer el secreto en ${rutaCompleta}`, {
      cause: error,
    });
  }

  //un secreto no puede estar vacío, si lo está es un error de configuración
  if (!valor) {
    throw new Error(`El secreto en ${variable} está vacío`);
  }
  return valor;
}
