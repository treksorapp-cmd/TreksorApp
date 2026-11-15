'use strict';
// Cross-platform Today contract: date-only completion markers, no private check-in text.
function todayLocalDate(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function validTodayDay(day){return typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)}
async function readSharedTodayDays(owner){
 if(!owner||state.user?.id!==owner)throw Error('Please sign in again.');
 const rows=await query(db.from('treksor_sync_events').select('event_key,source').eq('user_id',owner).eq('kind','today_completed').order('event_key',{ascending:false}).limit(90));
 if(state.user?.id!==owner)throw Error('Your account changed.');
 return [...new Set((rows||[]).map(x=>x.event_key).filter(validTodayDay))].sort().reverse();
}
async function renderToday(version){
 if(!state.user){main.innerHTML=signInPage();return}
 const owner=state.user.id,days=await readSharedTodayDays(owner);
 if(version!==state.routeVersion||state.user?.id!==owner)return;
 const today=todayLocalDate(),completed=days.includes(today);
 main.innerHTML=pageTop('YOUR DAILY PRACTICE','Today.<br>One direction.','Your completed-day marker is shared between your app and this website.')+spaceTabs('today')+
 `<section class="dashboard"><div class="wrap"><div class="detail-panel">
 <div class="eyebrow">SHARED TODAY</div><h2>${completed?'Today is recorded.':'Make today count.'}</h2>
 <p>${completed?'You recorded a completed day on one of your Treksor devices.':'Only record completion after you actually finish your daily practice.'}</p>
 <div class="spaced">${completed?'<span class="tag">Completed · '+today+'</span>':btn('Mark today complete','complete-today')}</div>
 <p class="helper spaced">This shares only the date. Individual tasks, mood, journal text and private notes are not copied between devices by this action. Records cannot currently be undone here.</p>
 </div><div class="detail-panel"><h3>Recent completed days</h3>
 ${days.length?days.slice(0,14).map(day=>`<div class="list-row"><span>${esc(day)}</span><strong>Completed</strong></div>`).join(''):'<p>No completed days synced yet. Open the app or mark a completed day here.</p>'}
 <a class="text-link spaced" href="#/progress">View synced Progress ↗</a></div></div></section>`;
}
async function completeTodayWeb(){
 if(!state.user)fail('Sign in to record your daily practice.');
 const owner=state.user.id,day=todayLocalDate();
 const {error}=await db.from('treksor_sync_events').upsert({user_id:owner,kind:'today_completed',event_key:day,pillar:null,source:'web',payload:{}},{onConflict:'user_id,kind,event_key',ignoreDuplicates:true});
 if(error)throw error;
 if(state.user?.id!==owner)fail('Your account changed. Please sign in again.');
 toast('Today completion saved for your account.');
 await render();
}
