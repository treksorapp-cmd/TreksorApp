import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutStore } from '@/store/workout-store';
import { useTrackingStore } from '@/store/tracking-store';
import { useArticleStore } from '@/store/article-store';
import { useMediationStore } from '@/store/mediation-store';
import { usePowerThoughtStore } from '@/store/thought-store';
import { useProgressSyncStore } from '@/store/progress-sync-store';
import { prepareProgressAccount, isProgressAccountReady } from '@/lib/local-progress';
import { buildProgressPayload } from '@/lib/progress-payload';
import { supabaseAuth } from '@/api/supabase-auth';

const URL='https://niakfwerfqmrmhuypkpd.supabase.co/rest/v1/app_progress';
const KEY='sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8';

export function useProgressSync() {
  const userId=useAuthStore(s => s.isAuthenticated ? s.user.id : '');
  useEffect(() => {
    let alive=true, busy=false, ready=false, lastPayload='', deviceId='';
    let timer: ReturnType<typeof setTimeout>;
    const controller=new AbortController();
    const sameAccount=()=>alive && useAuthStore.getState().isAuthenticated && useAuthStore.getState().user.id===userId;
    const current=()=>sameAccount() && isProgressAccountReady(userId);
    const status=(data:Partial<ReturnType<typeof useProgressSyncStore.getState>>)=>{if(sameAccount())useProgressSyncStore.setState(data)};
    if(!userId){useProgressSyncStore.setState({status:'idle',lastSynced:null,message:'Sign in to sync with your web profile.',requestSync:()=>{}});return;}
    async function request(method:string,path:string,body?:unknown,retry=true):Promise<any> {
      if(!current())throw new Error('Account changed');
      const auth=useAuthStore.getState();
      const attempt=new AbortController();
      const abort=()=>attempt.abort();controller.signal.addEventListener("abort",abort,{once:true});
      const timeout=setTimeout(()=>attempt.abort(),20000);
      let response:Response;
      try { response=await fetch(URL+path,{method,headers:{apikey:KEY,Authorization:'Bearer '+auth.token,'Content-Type':'application/json',Prefer:'return=representation'},body:body?JSON.stringify(body):undefined,signal:attempt.signal}); }
      finally { clearTimeout(timeout);controller.signal.removeEventListener("abort",abort); }
      if(response.status===401 && retry && auth.refreshToken){
        const refreshed=await supabaseAuth.refresh(auth.refreshToken);
        if(!current() || !refreshed.access_token)throw new Error('Please sign in again to sync.');
        useAuthStore.setState({token:refreshed.access_token,refreshToken:refreshed.refresh_token||auth.refreshToken});
        return request(method,path,body,false);
      }
      if(!response.ok)throw new Error('Unable to sync. Your progress remains on this device.');
      return response.json();
    }
    async function sync(force=false) {
      if(!ready||busy||!current()||AppState.currentState==='background')return;
      busy=true;
      try {
        await useTrackingStore.getState().fetchTrackingData();
        const thoughts=await AsyncStorage.getItem('treksor.thoughts.read.v1');
        const vision=await AsyncStorage.getItem('treksor.vision-board.v1');
        const payload=buildProgressPayload({device:Platform.OS==='ios'?'iPhone / iPad':Platform.OS==='android'?'Android':'Treksor app',workout:useWorkoutStore.getState(),tracking:useTrackingStore.getState().trackingData,articles:useArticleStore.getState().articles,meditations:useMediationStore.getState().mediation,thoughtDates:thoughts?JSON.parse(thoughts):{},vision:vision?JSON.parse(vision):null});
        const json=JSON.stringify(payload);
        if(!force&&json===lastPayload)return;
        status({status:'syncing',message:'Syncing with your web profile…'});
        const path='?user_id=eq.'+encodeURIComponent(userId)+'&device_id=eq.'+encodeURIComponent(deviceId);
        // Update only payload: identity columns cannot be changed by a client.
        let rows=await request('PATCH',path,{payload});
        if(!rows.length)rows=await request('POST','',{user_id:userId,device_id:deviceId,payload});
        if(!current())return;
        lastPayload=json;
        status({status:'synced',lastSynced:rows[0].updated_at,message:'Your progress is available on the Treksor website.'});
      }catch(error){status({status:'error',message:error instanceof Error?error.message:'Sync paused. Tap to retry.'});}
      finally{busy=false;}
    }
    async function refreshProfile(){
      if(!current())return;
      try{const auth=useAuthStore.getState();if(!auth.token)return;const result=await supabaseAuth.currentUser(auth.token);const u=result.user??(result as any);if(current()&&u.id===userId)useAuthStore.setState({user:{...useAuthStore.getState().user,name:u.user_metadata?.name||'',avatar:u.user_metadata?.avatar_url||''}})}catch{/* Offline: keep the session and retry on next foreground. */}
    }
    const schedule=()=>{if(busy)return;clearTimeout(timer);timer=setTimeout(()=>void sync(),1800)};
    useProgressSyncStore.setState({status:'idle',lastSynced:null,message:'Preparing your progress…',requestSync:()=>void sync(true)});
    const off=[useWorkoutStore.subscribe(schedule),useTrackingStore.subscribe(schedule),useArticleStore.subscribe(schedule),useMediationStore.subscribe(schedule),usePowerThoughtStore.subscribe(schedule)];
    const active=AppState.addEventListener('change',s=>{if(s==='active'){void sync(true).then(refreshProfile)}});
    const interval=setInterval(()=>void sync(),60000);
    (async()=>{try{
      await prepareProgressAccount(userId);
      const key='treksor.progress.device.v1';deviceId=await AsyncStorage.getItem(key)||'';
      if(!deviceId){deviceId='device-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);await AsyncStorage.setItem(key,deviceId)}
      ready=true;await sync(true);
    }catch{status({status:'error',message:'Unable to prepare progress. Reopen the app to retry.'})}})();
    return()=>{alive=false;controller.abort();clearTimeout(timer);clearInterval(interval);off.forEach(fn=>fn());active.remove()};
  },[userId]);
}
