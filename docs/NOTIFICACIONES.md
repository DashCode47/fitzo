# Guía de Notificaciones Masivas - Fitzo 🦾

Esta guía explica cómo funciona el sistema de notificaciones de Fitzo y cómo enviar mensajes masivos a todos los usuarios (Android e iOS).

## 1. Funcionamiento del Sistema

El flujo de notificaciones sigue este estándar:
1.  **Registro**: Cuando un usuario abre la app en un dispositivo físico, se genera un `ExpoPushToken`.
2.  **Almacenamiento**: Este token se guarda automáticamente en la tabla `profiles` de Supabase (columna `push_token`).
3.  **Envío**: El backend (Supabase Edge Function) consulta los tokens y los envía al servicio de Expo.

---

## 2. Cómo enviar una Notificación Masiva

Hemos creado una **Edge Function** en Supabase llamada `broadcast-notification` que se encarga de todo el proceso técnico (incluyendo la división de mensajes en bloques de 100 para cumplir con los límites de Expo).

### Requisitos
- Tener instalada la **Supabase CLI**.
- Haber desplegado la función: `supabase functions deploy broadcast-notification`.

### Comando para enviar (desde Terminal)
Puedes disparar la notificación masiva usando un comando `curl`:

```bash
curl -X POST 'https://[TU_PROYECTO_ID].supabase.co/functions/v1/broadcast-notification' \
-H 'Authorization: Bearer [TU_SERVICE_ROLE_KEY]' \
-H 'Content-Type: application/json' \
-d '{
  "title": "¡Título de la Notificación!",
  "body": "Este es el mensaje que verán todos los usuarios.",
  "data": { "pantalla": "routines" }
}'
```

### Parámetros del JSON:
-   `title`: El título que aparece en negrita arriba.
-   `body`: El texto principal de la notificación.
-   `data` (Opcional): Un objeto JSON con datos adicionales que la app puede usar (ej. para abrir una pantalla específica).

---

## 3. Pruebas Rápidas (Expo Push Tool)

Si solo quieres enviarle una notificación a **un solo usuario** para probar sin usar el comando masivo:

1.  Busca el `push_token` del usuario en la tabla `profiles` de Supabase.
2.  Entra en: [https://expo.dev/notifications](https://expo.dev/notifications)
3.  Pega el token y escribe tu mensaje.

---

## 4. Solución de Problemas

- **Notificación no llega**: 
    - Verifica que el usuario aceptó los permisos en su celular.
    - Asegúrate de estar probando en un **dispositivo físico** (no funciona en simuladores).
    - Revisa que las credenciales de Firebase (FCM V1) estén correctamente configuradas en Expo (`eas credentials`).
- **Error "DeviceNotRegistered"**: 
    - El token ha caducado o el usuario desinstaló la app. La función de envío masivo lo ignora automáticamente.
