# Los Tragedias — Guía de despliegue (gratis, a tu nombre)

Esta guía te lleva de "código en una carpeta" a "URL pública que puede abrir
cualquiera, sin cuenta de Claude". Todo con cuentas personales gratuitas.

Tiempo estimado: 20-30 minutos la primera vez.

---

## Paso 1 — Crear la base de datos (Firebase)

1. Ve a <https://console.firebase.google.com> e inicia sesión con una cuenta
   de Google personal (si no tienes, créala, es gratis).
2. Pulsa **"Crear proyecto"**. Ponle un nombre, por ejemplo `los-tragedias`.
   No hace falta activar Google Analytics — puedes desmarcarlo.
3. Dentro del proyecto, en el menú de la izquierda: **Compilación (Build) →
   Firestore Database → Crear base de datos**.
   - Elige la ubicación más cercana (por ejemplo `eur3 (europe-west)`).
   - Selecciona **"Iniciar en modo de prueba"**.
4. Ve a la pestaña **Reglas** de Firestore y sustituye lo que haya por esto:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /house/{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

   Pulsa **Publicar**.

   > ⚠️ Esto deja la base de datos abierta a quien conozca la configuración
   > del proyecto. Es aceptable para una app informal de gastos entre
   > compañeros de piso, pero no la uses para datos sensibles. Si más
   > adelante quieres cerrarlo mejor (por ejemplo con contraseña real),
   > dímelo y lo reforzamos.

5. Ve a **Configuración del proyecto** (el icono de engranaje, arriba a la
   izquierda) → pestaña **General** → baja hasta **"Tus apps"** → pulsa el
   icono **`</>`** (Web).
6. Ponle un apodo a la app (ej. `los-tragedias-web`) y pulsa **Registrar app**.
   Firebase te mostrará un bloque `firebaseConfig` con varias claves
   (`apiKey`, `authDomain`, `projectId`...). **Cópialo.**
7. Abre el archivo `src/firebase.js` de este proyecto y sustituye los
   valores de ejemplo por los tuyos.

---

## Paso 2 — Subir el código a GitHub

1. Crea una cuenta gratuita en <https://github.com> si no tienes.
2. Pulsa **"New repository"**, nómbralo `los-tragedias`, déjalo en
   **Public** o **Private** (ambas valen), y créalo vacío (sin README).
3. Sube esta carpeta al repositorio. La forma más sencilla si no usas la
   terminal: en la página del repo, **"Add file" → "Upload files"**, arrastra
   todos los archivos y carpetas de este proyecto, y confirma el commit.
   - Si prefieres la terminal, dentro de esta carpeta:
     ```
     git init
     git add .
     git commit -m "Los Tragedias"
     git branch -M main
     git remote add origin https://github.com/TU_USUARIO/los-tragedias.git
     git push -u origin main
     ```

---

## Paso 3 — Desplegar en Vercel (hosting gratuito)

1. Ve a <https://vercel.com> y regístrate con tu cuenta de GitHub (botón
   "Continue with GitHub").
2. Pulsa **"Add New..." → "Project"**.
3. Busca e importa el repositorio `los-tragedias`.
4. Vercel detecta automáticamente que es un proyecto Vite — no toques nada
   de la configuración. Pulsa **Deploy**.
5. En 1-2 minutos te dará una URL pública, algo como
   `https://los-tragedias.vercel.app`. Esa es la que compartes con tus
   compañeros de piso — se abre en cualquier navegador, sin cuenta de nada.

Cada vez que quieras actualizar la app, solo tienes que subir los cambios
al repositorio de GitHub (o pedírmelo a mí, que actualice los archivos, y
luego subirlos tú) — Vercel vuelve a desplegar solo.

---

## Paso 4 (opcional) — Dominio propio

En Vercel, dentro del proyecto: **Settings → Domains**, puedes añadir un
dominio que hayas comprado (Namecheap, Google Domains, etc.) y seguir las
instrucciones para apuntar el DNS. No es necesario — el `.vercel.app`
funciona perfectamente.

---

## Probarlo en tu ordenador antes de publicar (opcional)

Si tienes [Node.js](https://nodejs.org) instalado:

```
npm install
npm run dev
```

Y abre la URL que te indique la terminal (normalmente
`http://localhost:5173`).

---

## Cómo entran tus compañeros

Una vez publicada:

1. Les mandas la URL de Vercel.
2. La abren en el navegador del móvil (pueden "Añadir a pantalla de
   inicio" para que parezca una app instalada).
3. Tú, como administrador, les has dado de alta antes desde la pestaña
   **Casa** con su nombre, PIN y rol.
4. Entran eligiendo su nombre e introduciendo el PIN — ya está.

Nadie necesita cuenta de Claude, cuenta de Google, ni instalar nada.
