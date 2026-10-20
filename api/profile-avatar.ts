import { decode as decodeBase64 } from "base-64";
import type { ImagePickerAsset } from "expo-image-picker";

const URL = "https://niakfwerfqmrmhuypkpd.supabase.co";
const KEY = "sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8";
const BUCKET = "profile-avatars";

export async function uploadProfileAvatar(asset: ImagePickerAsset, userId: string, token: string): Promise<string> {
  if (!asset.base64) throw new Error("Photo data was not available. Please select the photo again.");
  if (!userId || !token) throw new Error("Please sign in again to upload your photo.");
  const raw = decodeBase64(asset.base64);
  if (raw.length > 5 * 1024 * 1024) throw new Error("Photo exceeds the 5 MB limit. Choose a smaller image.");
  const bytes = new Uint8Array(raw.length);
  for (let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);
  const name = userId + "/avatar-" + Date.now() + ".jpg";
  const endpoint = URL + "/storage/v1/object/" + BUCKET + "/" + name;
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(),25000);
  try {
    const response = await fetch(endpoint,{method:"POST",headers:{"apikey":KEY,"Authorization":"Bearer "+token,"Content-Type":"image/jpeg","cache-control":"3600"},body:bytes as any,signal:controller.signal});
    if (!response.ok) {
      const data=await response.json().catch(()=>({}));
      throw new Error(data.message||data.error||"Unable to upload profile photo.");
    }
  } catch(e) {
    if (e instanceof Error && e.name==="AbortError") throw new Error("Photo upload timed out. Please try again.");
    throw e;
  } finally {clearTimeout(timeout)}
  return URL + "/storage/v1/object/public/" + BUCKET + "/" + name;
}
