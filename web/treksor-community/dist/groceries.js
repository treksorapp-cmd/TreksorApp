'use strict';
async function readGroceries(owner){
 if(!owner||state.user?.id!==owner)fail('Sign in again to use the shopping list.');
 const rows=await query(db.from('nutrition_groceries').select('id,name,checked,created_at').eq('user_id',owner).order('created_at',{ascending:false}).limit(300));
 if(state.user?.id!==owner)fail('Your account changed.');
 return Array.isArray(rows)?rows:[];
}
async function renderGroceries(version){
 if(!state.user){main.innerHTML=signInPage();return}
 const owner=state.user.id,rows=await readGroceries(owner);
 if(version!==state.routeVersion||state.user?.id!==owner)return;
 const listing=(items)=>items.length?items.map(item=>`<div class="list-row"><button class="button small ghost" type="button" data-action="grocery-check" data-id="${esc(item.id)}" data-checked="${item.checked?'1':'0'}" aria-label="${item.checked?'Mark to buy again':'Mark as bought'}: ${esc(item.name)}">${item.checked?'✓':'○'}</button><span class="break-anywhere">${esc(item.name)}</span><button type="button" class="button small ghost" data-action="grocery-delete" data-id="${esc(item.id)}" aria-label="Delete ${esc(item.name)}">Remove</button></div>`).join(''):'<p class="helper">Nothing here yet.</p>';
 main.innerHTML=pageTop('BODY / NUTRITION','Shopping list.','One private list for your Treksor account, accessible from the app and website.')+spaceTabs('groceries')+
 `<section class="dashboard"><div class="wrap"><div class="detail-panel"><h2>Add something you need.</h2>
 <form id="grocery-form" class="form-grid"><label>Item<input name="name" required maxlength="100" autocomplete="off" placeholder="e.g. oats, apples, coffee"></label><div class="form-error" role="alert"></div><button class="button" type="submit">Add to list</button></form></div>
 <div class="detail-panel"><div class="dash-title"><h3>To buy (${rows.filter(x=>!x.checked).length})</h3>${btn('Refresh ↻','refresh','','ghost')}</div>${listing(rows.filter(x=>!x.checked))}</div>
 <div class="detail-panel"><h3>Purchased (${rows.filter(x=>x.checked).length})</h3>${listing(rows.filter(x=>x.checked))}</div>
 <div class="info-strip">${icon('shield')}<span>Only you can read and edit this list. Changes are visible from the other platform after refreshing it.</span></div></div></section>`;
}
async function updateGroceryWeb(action,id,checked){
 const owner=state.user?.id;if(!owner)fail('Sign in first.');
 const q=action==='delete'?db.from('nutrition_groceries').delete():db.from('nutrition_groceries').update({checked:!checked});
 const rows=await query(q.eq('user_id',owner).eq('id',id).select('id'));
 if(state.user?.id!==owner)fail('Your account changed.');
 if(!rows?.length)fail('This item was not found in your account.');
 await render();
}
async function addGroceryWeb(name){
 const owner=state.user?.id,clean=String(name||'').trim().slice(0,100);
 if(!owner)fail('Sign in first.');
 if(!clean)fail('Enter an item.');
 if(!window.crypto?.randomUUID)fail('This browser cannot create secure list items. Use a current HTTPS browser.');
 await query(db.from('nutrition_groceries').insert({id:window.crypto.randomUUID(),user_id:owner,name:clean,checked:false}).select('id'));
 if(state.user?.id!==owner)fail('Your account changed.');
 await render();
}
