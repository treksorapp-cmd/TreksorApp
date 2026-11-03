const BASE='https://niakfwerfqmrmhuypkpd.supabase.co/rest/v1';
const KEY='sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8';
export type CommunityEvent={id:string;title:string;description:string;category:string;city:string;meeting_point:string;starts_at:string;organizer_name:string};
// Read through the public RLS policy, never through an admin service key.
export async function loadCommunityEvents(signal:AbortSignal):Promise<CommunityEvent[]> {
 const result:CommunityEvent[]=[];
 for(let offset=0;;offset+=200){
  const params=new URLSearchParams({select:'id,title,description,category,city,meeting_point,starts_at,organizer_name',status:'eq.published',starts_at:`gt.${new Date().toISOString()}`,order:'starts_at.asc,id.asc',limit:'200',offset:String(offset)});
  const response=await fetch(`${BASE}/community_events?${params}`,{headers:{apikey:KEY},signal});
  if(!response.ok)throw Error('Activities could not be loaded. Please try again.');
  const rows=await response.json();if(!Array.isArray(rows))throw Error('Invalid activity response.');
  result.push(...rows);if(rows.length<200)return result;
 }
}
