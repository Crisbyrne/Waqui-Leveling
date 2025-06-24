# Waqui-Leveling

Waqui-Leveling es una aplicación web para la gestión de retos personales y colaborativos. Permite a los usuarios crear, seguir y completar metas diarias, semanales o mensuales, con funcionalidades de seguimiento de progreso y rachas.

## Características

- Autenticación de usuarios con Firebase
- Base de datos en tiempo real con Firestore
- Creación de retos personales y colaborativos
- Seguimiento de progreso y rachas
- Sistema de apuestas entre amigos
- Interfaz responsiva para dispositivos móviles
- Compatibilidad mejorada con iOS

## Tecnologías Utilizadas

- HTML5, CSS3 y JavaScript (ES6+)
- Firebase Authentication
- Firebase Firestore
- Diseño responsivo con CSS Grid y Flexbox
- LocalStorage (para compatibilidad y respaldo)

## Configuración de Firebase

La aplicación utiliza Firebase para la autenticación de usuarios y para almacenar los datos en la nube. Para configurar Firebase en el proyecto:

1. Crea un proyecto en la [consola de Firebase](https://console.firebase.google.com/)
2. Registra tu aplicación web en Firebase
3. Copia las credenciales de configuración proporcionadas por Firebase
4. Actualiza el archivo `js/firebase-config.js` con tus credenciales

Para obtener instrucciones detalladas, consulta el archivo [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

## Estructura del Proyecto

- `index.html`: Estructura principal de la aplicación y templates para las diferentes vistas
- `css/`: Archivos de estilos
  - `styles.css`: Estilos generales
  - `components.css`: Estilos de componentes específicos
  - `ios-fixes.css`: Fixes específicos para Safari en iOS
- `js/`: Scripts JavaScript
  - `app.js`: Lógica principal de la aplicación
  - `auth.js`: Gestión de autenticación
  - `challenges.js`: Lógica para gestión de retos
  - `router.js`: Sistema de navegación para SPA
  - `firebase-config.js`: Configuración de Firebase
  - `firebase-auth.js`: Servicios de autenticación con Firebase
  - `firebase-db.js`: Servicios de base de datos con Firebase
  - `firebase-migration.js`: Utilidad para migrar datos a Firebase
  - `animations.js`: Animaciones y efectos visuales
- `img/`: Recursos gráficos

## Funciones Principales

### Gestión de Usuarios
- Registro con correo y contraseña
- Inicio de sesión
- Actualización de perfil
- Visualización de estadísticas

### Gestión de Retos
- Creación de retos personales
- Invitación a retos colaborativos
- Seguimiento de progreso
- Sistema de rachas

### Calendario y Seguimiento
- Visualización del calendario mensual
- Marcadores de progreso diario
- Estadísticas de rendimiento

## Instalación y Uso

1. Clona o descarga este repositorio
2. Configura Firebase según las instrucciones en [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
3. Abre `index.html` en tu navegador web

Para implementar en producción:
```bash
# Si utilizas Firebase Hosting
firebase deploy
```

## Migración de Datos

Si ya tienes datos en localStorage, la aplicación incluye una herramienta de migración que se ejecutará automáticamente al iniciar la aplicación con Firebase configurado. Esta herramienta migrará tus usuarios, retos e historial a Firestore.

## Licencia

Este proyecto está bajo licencia MIT.