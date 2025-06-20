# Waqui Leveling

Una aplicación web simple para hacer seguimiento de retos personales y colaborativos.

## Características

- Registro e inicio de sesión de usuarios
- Creación y gestión de retos personales y colaborativos
- Seguimiento de progreso con barras de progreso visuales
- Calendario para ver el avance diario
- Perfil de usuario editable
- Diseño responsivo y adaptable a diferentes dispositivos

## Tecnologías Utilizadas

- HTML5
- CSS3 (con variables CSS y diseño responsivo)
- JavaScript (Vanilla, sin frameworks)
- LocalStorage para persistencia de datos

## Estructura del Proyecto

```
waqui-leveling/
├── css/
│   ├── styles.css      # Estilos globales
│   └── components.css  # Estilos de componentes
├── js/
│   ├── router.js       # Manejo de rutas y navegación
│   ├── app.js          # Lógica principal de la aplicación
│   ├── auth.js         # Autenticación y manejo de usuarios
│   └── challenges.js   # Gestión de retos
├── index.html          # Página principal y templates
└── README.md          # Documentación
```

## Cómo Ejecutar

1. Clona este repositorio:
   ```bash
   git clone <url-del-repositorio>
   ```

2. Abre el archivo `index.html` en tu navegador web preferido.

   O si prefieres usar un servidor local:
   ```bash
   # Si tienes Python instalado
   python -m http.server 8000

   # Si tienes Node.js instalado
   npx http-server
   ```

3. Accede a la aplicación en tu navegador:
   - Si usas Python: `http://localhost:8000`
   - Si usas Node.js: `http://localhost:8080`

## Uso

1. **Registro/Inicio de Sesión**
   - Crea una cuenta con tu nombre, email y contraseña
   - O inicia sesión si ya tienes una cuenta

2. **Crear un Nuevo Reto**
   - Haz clic en "Nuevo Reto" en la barra de navegación
   - Completa el formulario con los detalles del reto:
     - Nombre
     - Descripción
     - Tipo (Personal o Colaborativo)
     - Unidad de medida
     - Meta
     - Fecha límite

3. **Seguimiento de Progreso**
   - En el dashboard, verás todos tus retos activos
   - Actualiza el progreso haciendo clic en el botón "Actualizar Progreso"
   - Visualiza el avance en la barra de progreso

4. **Calendario**
   - Ve tu progreso diario en el calendario
   - Los días con actividad se marcan en verde

5. **Perfil**
   - Edita tu información personal
   - Cambia tu nombre de usuario

## Seguridad

- Las contraseñas se almacenan de forma segura (hasheadas)
- Los datos se guardan localmente en el navegador
- Las rutas protegidas requieren autenticación

## Limitaciones

- Al usar LocalStorage, los datos se almacenan solo en el navegador local
- No hay sincronización entre dispositivos
- Las contraseñas se hashean de forma simple (en una versión de producción se usaría bcrypt o similar)

## Próximas Mejoras

- [ ] Añadir backend para persistencia de datos
- [ ] Implementar autenticación más robusta
- [ ] Añadir funcionalidades sociales y colaborativas
- [ ] Mejorar la visualización de estadísticas
- [ ] Añadir notificaciones y recordatorios

## Contribuir

Si deseas contribuir a este proyecto:

1. Haz un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles. 