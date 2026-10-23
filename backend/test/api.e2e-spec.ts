import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------- Utilidades ----------

function variable(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta ${nombre} en backend/.env`);
  return valor;
}

const URL_BASE = variable('E2E_URL');
const ADMIN_CORREO = variable('E2E_ADMIN_CORREO');
const ADMIN_CONTRASENA = readFileSync(
  resolve(process.cwd(), variable('E2E_ADMIN_CONTRASENA_FILE')),
  'utf8',
).trim();

// Un "navegador" mínimo: guarda la cookie de sesión y la manda en cada petición
class Cliente {
  private cookie = '';

  async pedir(metodo: string, ruta: string, cuerpo?: unknown) {
    const headers: Record<string, string> = {};
    if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
    if (this.cookie) headers['Cookie'] = this.cookie;

    const respuesta = await fetch(URL_BASE + ruta, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });

    const nuevaCookie = respuesta.headers
      .getSetCookie()
      .find((c) => c.startsWith('sgd.sid='));
    if (nuevaCookie) this.cookie = nuevaCookie.split(';')[0];

    const texto = await respuesta.text();
    return {
      status: respuesta.status,
      cuerpo: texto ? JSON.parse(texto) : null,
    };
  }

  login(correo: string, contrasena: string) {
    return this.pedir('POST', '/auth/login', { correo, contrasena });
  }
}

// Datos aleatorios: cada ejecución usa usuarios nuevos, sin contraseñas fijas
const sufijo = Date.now();
const claveAleatoria = () => randomBytes(18).toString('base64url');

// ---------- Pruebas ----------

describe('API de punta a punta', () => {
  const admin = new Cliente();
  const consulta = new Cliente();
  const cargador = new Cliente();
  let idConsulta = '';
  let idCargador = '';

  beforeAll(async () => {
    // El admin de pruebas entra y crea dos usuarios temporales
    const r = await admin.login(ADMIN_CORREO, ADMIN_CONTRASENA);
    if (r.status !== 200)
      throw new Error(
        `No se pudo iniciar sesión como admin de pruebas (${r.status})`,
      );

    const claveConsulta = claveAleatoria();
    const claveCargador = claveAleatoria();

    const c1 = await admin.pedir('POST', '/usuarios', {
      correo: `e2e-consulta-${sufijo}@prueba.local`,
      nombre: 'E2E Consulta',
      rol: 'CONSULTA',
      contrasena: claveConsulta,
    });
    const c2 = await admin.pedir('POST', '/usuarios', {
      correo: `e2e-cargador-${sufijo}@prueba.local`,
      nombre: 'E2E Cargador',
      rol: 'CARGADOR',
      contrasena: claveCargador,
    });
    idConsulta = c1.cuerpo.id;
    idCargador = c2.cuerpo.id;

    await consulta.login(`e2e-consulta-${sufijo}@prueba.local`, claveConsulta);
    await cargador.login(`e2e-cargador-${sufijo}@prueba.local`, claveCargador);
  });

  afterAll(async () => {
    // No se borra nada: los usuarios temporales se desactivan
    if (idConsulta)
      await admin.pedir('PATCH', `/usuarios/${idConsulta}`, { activo: false });
    if (idCargador)
      await admin.pedir('PATCH', `/usuarios/${idCargador}`, { activo: false });
  });

  describe('sin sesión', () => {
    const anonimo = new Cliente();

    it('/health es público', async () => {
      expect((await anonimo.pedir('GET', '/health')).status).toBe(200);
    });

    it('las facturas exigen iniciar sesión (401)', async () => {
      const r = await anonimo.pedir('GET', '/facturas-por-cobrar');
      expect(r.status).toBe(401);
      expect(r.cuerpo.idPeticion).toBeDefined();
    });

    it('una contraseña incorrecta da 401 con mensaje genérico', async () => {
      const r = await anonimo.login(ADMIN_CORREO, 'clave-equivocada-123');
      expect(r.status).toBe(401);
      expect(r.cuerpo.message).toBe('Correo o contraseña incorrectos');
    });
  });

  describe('rol CONSULTA', () => {
    it('puede buscar facturas', async () => {
      expect((await consulta.pedir('GET', '/facturas-por-cobrar')).status).toBe(
        200,
      );
    });

    it('no puede crear tipos de documento (403)', async () => {
      const r = await consulta.pedir('POST', '/tipos-documento', {
        codigo: 'E2E',
        nombre: 'No debe crearse',
      });
      expect(r.status).toBe(403);
    });

    it('no puede administrar usuarios (403)', async () => {
      expect((await consulta.pedir('GET', '/usuarios')).status).toBe(403);
    });
  });

  describe('rol CARGADOR', () => {
    it('puede ver los tipos de documento', async () => {
      expect((await cargador.pedir('GET', '/tipos-documento')).status).toBe(
        200,
      );
    });

    it('no puede crear tipos de documento (403)', async () => {
      const r = await cargador.pedir('POST', '/tipos-documento', {
        codigo: 'E2E',
        nombre: 'No debe crearse',
      });
      expect(r.status).toBe(403);
    });
  });

  describe('rol ADMIN', () => {
    it('lista usuarios sin exponer contraseñas ni hashes', async () => {
      const r = await admin.pedir('GET', '/usuarios');
      expect(r.status).toBe(200);
      const texto = JSON.stringify(r.cuerpo);
      expect(texto).not.toContain('passwordHash');
      expect(texto).not.toContain('scrypt$');
    });

    it('no puede quitarse su propio rol de administrador (400)', async () => {
      const yo = await admin.pedir('GET', '/auth/yo');
      const r = await admin.pedir('PATCH', `/usuarios/${yo.cuerpo.id}`, {
        rol: 'CONSULTA',
      });
      expect(r.status).toBe(400);
    });

    it('rechaza campos que no existen en el DTO (400)', async () => {
      const r = await admin.pedir('PATCH', `/usuarios/${idConsulta}`, {
        correo: 'otro@prueba.local',
      });
      expect(r.status).toBe(400);
    });

    it('al cambiar el rol de un usuario, su sesión se cierra', async () => {
      expect((await consulta.pedir('GET', '/auth/yo')).status).toBe(200);

      await admin.pedir('PATCH', `/usuarios/${idConsulta}`, {
        rol: 'CARGADOR',
      });

      expect((await consulta.pedir('GET', '/auth/yo')).status).toBe(401);
    });

    it('la auditoría registró los inicios de sesión', async () => {
      const r = await admin.pedir('GET', '/auditoria');
      expect(r.status).toBe(200);
      const acciones = (r.cuerpo as { accion: string }[]).map((x) => x.accion);
      expect(acciones).toContain('LOGIN_OK');
      expect(acciones).toContain('USUARIO_CREADO');
    });
  });
});
