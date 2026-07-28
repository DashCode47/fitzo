import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuración de cómo se comportan las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationService = {
  async registerForPushNotificationsAsync(userId: string) {
    let token;

    if (!Device.isDevice) {
      console.log('Debes usar un dispositivo físico para notificaciones push');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('No se pudieron obtener permisos para notificaciones');
        return null;
      }

      // Obtener el token de Expo
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      const expoToken = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      token = expoToken.data;
      console.log('Expo Push Token (Service):', token);

      // Guardar el token en Supabase vinculado al usuario
      if (token && userId) {
        const { error } = await supabase
          .from('profiles')
          .update({ push_token: token })
          .eq('id', userId);

        if (error) {
          console.error('Error guardando el token en Supabase (update):', error);
        } else {
          console.log('Token guardado exitosamente en el perfil del usuario');
        }
      }

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (error) {
      console.error('Error en registerForPushNotificationsAsync:', error);
      return null;
    }
  }
};
