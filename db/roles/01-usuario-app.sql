-- Usuario de la aplicacion con permisos minimos.
-- La contrasena NO esta aqui: llega como variable :'app_password'.

-- 1. Crear el usuario solo si no existe
SELECT format('CREATE ROLE docs_app LOGIN PASSWORD %L', :'app_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'docs_app')
\gexec

-- 2. Permiso para conectarse a la base y entrar al esquema
GRANT CONNECT ON DATABASE sistema_documental TO docs_app;
GRANT USAGE ON SCHEMA public TO docs_app;

-- 3. Solo datos: leer, insertar, actualizar (sin DELETE, sin DROP, sin ALTER)
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO docs_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO docs_app;

-- 4. Las tablas que se creen en el futuro tendran los mismos permisos
ALTER DEFAULT PRIVILEGES FOR ROLE docs_admin IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO docs_app;
ALTER DEFAULT PRIVILEGES FOR ROLE docs_admin IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO docs_app;