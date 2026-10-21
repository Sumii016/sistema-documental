// Lee una contraseña sin mostrarla en pantalla
export function preguntarOculto(texto: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const entrada = process.stdin;
    process.stdout.write(texto);
    let valor = '';
    entrada.setRawMode(true);
    entrada.resume();
    entrada.setEncoding('utf8');

    const alTeclear = (teclas: string) => {
      for (const c of teclas) {
        if (c === '\r' || c === '\n') {
          entrada.setRawMode(false);
          entrada.pause();
          entrada.off('data', alTeclear);
          process.stdout.write('\n');
          resolve(valor);
          return;
        }
        if (c === '\u0003') {
          entrada.setRawMode(false);
          reject(new Error('Cancelado'));
          return;
        }
        if (c === '\b' || c === '\u007f') {
          valor = valor.slice(0, -1);
          continue;
        }
        valor += c;
      }
    };
    entrada.on('data', alTeclear);
  });
}
