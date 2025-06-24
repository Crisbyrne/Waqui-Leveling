# Instrucciones para configurar Firebase en Waqui Leveling

Este documento contiene las instrucciones para configurar Firebase en la aplicación Waqui Leveling. La aplicación utiliza Firebase para autenticación de usuarios y para almacenar los datos de los retos en Firestore.

## Paso 1: Crear un proyecto en Firebase

1. Ve a la [consola de Firebase](https://console.firebase.google.com/) y inicia sesión con tu cuenta de Google.
2. Haz clic en "Crear un proyecto" y sigue las instrucciones.
3. Dale un nombre a tu proyecto (ej. "waqui-leveling").
4. Puedes habilitar Google Analytics si lo deseas (opcional).
5. Haz clic en "Crear proyecto" y espera a que se complete la creación.

## Paso 2: Registrar tu aplicación web

1. En la consola de Firebase, haz clic en el ícono de la web (</>) para añadir una aplicación web.
2. Dale un nombre a tu aplicación (ej. "Waqui Leveling Web").
3. Marca la opción "Configurar también Firebase Hosting" si deseas utilizar Firebase Hosting.
4. Haz clic en "Registrar app".
5. Se mostrarán los detalles de configuración de Firebase. Copia estos detalles para usarlos en el siguiente paso.

## Paso 3: Configurar Firebase en la aplicación

1. Abre el archivo `js/firebase-config.js` en tu editor de código.
2. Reemplaza los valores de `firebaseConfig` con los que obtuviste al registrar tu aplicación:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO_ID.firebaseapp.com",
  projectId: "TU_PROYECTO_ID",
  storageBucket: "TU_PROYECTO_ID.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID",
  measurementId: "TU_MEASUREMENT_ID" // Esto es opcional
};
```

## Paso 4: Habilitar autenticación por correo electrónico y contraseña

1. En la consola de Firebase, ve a "Authentication" en el menú lateral.
2. Haz clic en "Sign-in method".
3. Habilita el proveedor de "Email/Password".
4. Haz clic en "Guardar".

## Paso 5: Configurar Firestore Database

1. En la consola de Firebase, ve a "Firestore Database" en el menú lateral.
2. Haz clic en "Crear base de datos".
3. Selecciona "Comenzar en modo de prueba" para desarrollo. Esto permitirá lecturas y escrituras sin autenticación por 30 días.
4. Selecciona la ubicación más cercana a tus usuarios y haz clic en "Habilitar".

## Paso 6: Crear reglas de seguridad para Firestore

1. En la consola de Firebase, ve a "Firestore Database" y luego a la pestaña "Reglas".
2. Reemplaza las reglas predeterminadas con las siguientes para permitir acceso solo a usuarios autenticados:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite a los usuarios leer/escribir sus propios documentos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /challenges/{challengeId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.uid in resource.data.participants);
    }
  }
}
```

3. Haz clic en "Publicar".

## Paso 7: Migrar datos existentes (si aplica)

Si tienes datos existentes en localStorage (como usuarios o retos), la aplicación incluye una herramienta de migración que se ejecutará automáticamente la primera vez que un usuario abra la aplicación con Firebase configurado.

La herramienta migrará:
- Cuentas de usuario
- Retos y su historial
- Configuraciones de usuario

## Paso 8: Implementar en producción (opcional)

Si deseas implementar la aplicación usando Firebase Hosting:

1. Instala Firebase CLI: `npm install -g firebase-tools`
2. Inicia sesión: `firebase login`
3. Inicializa Firebase en tu proyecto: `firebase init`
4. Selecciona "Hosting" y sigue las instrucciones.
5. Implementa con: `firebase deploy`

## Notas importantes

- No compartas tus claves de Firebase en repositorios públicos.
- Para entornos de producción, asegúrate de configurar reglas de seguridad adecuadas en Firestore.
- Si tienes problemas con la migración, puedes resetear el proceso eliminando la clave `firebase_migration_complete` del localStorage.

¡Tu aplicación Waqui Leveling ahora está configurada para usar Firebase! 