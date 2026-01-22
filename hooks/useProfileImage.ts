import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/utils/async';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

export const useProfileImage = () => {
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async () => {
    try {
      setUploading(true);
      console.log("[useProfileImage] Starting upload process (ArrayBuffer method)...");

      // 1. Request permission and select image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log("[useProfileImage] Image selection canceled");
        setUploading(false);
        return null;
      }

      const image = result.assets[0];
      console.log("[useProfileImage] Image selected:", {
        uri: image.uri,
        width: image.width,
        height: image.height
      });

      const authResult = await withTimeout(supabase.auth.getUser());
      const user = authResult.data.user;

      if (!user) {
        console.error("[useProfileImage] No authenticated user found");
        throw new Error("Usuario no autenticado");
      }

      // 2. Prepare file for Supabase using ArrayBuffer (More robust on Android)
      console.log("[useProfileImage] Reading file as base64...");
      if (!FileSystem || !FileSystem.readAsStringAsync) {
        throw new Error("FileSystem no está disponible.");
      }
      
      const base64 = await FileSystem.readAsStringAsync(image.uri, {
        encoding: 'base64' as any,
      });
      console.log("[useProfileImage] Base64 string length:", base64.length);

      const arrayBuffer = decode(base64);
      console.log("[useProfileImage] ArrayBuffer created, size:", arrayBuffer.byteLength);

      const fileExt = image.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;
      const contentType = `image/${fileExt === 'png' ? 'png' : 'jpeg'}`;

      console.log("[useProfileImage] Uploading to Supabase Storage...", {
        path: filePath,
        contentType
      });

      // 3. Upload to Supabase Storage (Upsert to overwrite)
      const uploadResponse: any = await withTimeout(
        supabase.storage
          .from('avatars')
          .upload(filePath, arrayBuffer, {
            contentType,
            upsert: true,
          }) as any,
        30000, // 30s timeout for upload
        'La subida de la imagen tardó demasiado. Verifica tu conexión.'
      );

      if (uploadResponse.error) {
        console.error("[useProfileImage] Supabase Storage error:", uploadResponse.error);
        throw uploadResponse.error;
      }
      console.log("[useProfileImage] Upload successful");

      // 4. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      console.log("[useProfileImage] Public URL generated:", publicUrl);

      // 5. Update the profile table
      console.log("[useProfileImage] Updating profile in DB (column photo_url)...");
      const { data: updateData, error: updateError } = (await withTimeout(
        supabase
          .from('profiles')
          .update({ photo_url: publicUrl }) 
          .eq('id', user.id)
          .select()
          .single() as any
      )) as any;
      
      if (updateError) {
        console.error("[useProfileImage] Profile update failed:", updateError);
        throw updateError;
      }

      console.log("[useProfileImage] Profile photo updated successfully");

      return publicUrl;
    } catch (error: any) {
      console.error("[useProfileImage] Fatal error in uploadAvatar:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { uploadAvatar, uploading };
};
