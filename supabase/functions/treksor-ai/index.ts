import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import {mentorInstruction,mentorModes,parseMentorBrief,briefText,parseMemory} from "../_shared/mentor.ts";
const url = Deno.env.get("SUPABASE_URL") ?? "";
const pub = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const openai = Deno.env.get("OPENAI_API_KEY") ?? "";
const headers = { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods":"POST, OPTIONS" };
const reply = (status: number, data: unknown) => new Response(JSON.stringify(data), { status, headers });
const chronological=(rows:any[])=>rows.slice().sort((a,b)=>(Date.parse(a.created_at)||0)-(Date.parse(b.created_at)||0)||(a.role===b.role?0:a.role==="user"?-1:1));
const uuid = (x: unknown) => typeof x === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
Deno.serve(async (req: Request) => {
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if (req.method !== "POST") return reply(405,{error:"Method not allowed"});
 if (Number(req.headers.get("content-length") || "0") > 12000) return reply(413,{error:"Request too large"});
 const token = req.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
 if (!token) return reply(401,{error:"Sign in required"});
 if (!url || !pub || !service) return reply(503,{error:"Mentor service is not configured"});
 const auth = createClient(url,pub,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError} = await auth.auth.getUser(token);
 if (authError || !user) return reply(401,{error:"Invalid session"});
 let body: {message?:unknown;conversationId?:unknown;action?:unknown;memory?:any;memoryId?:unknown;brief?:unknown;shareBrief?:unknown;mode?:unknown};
 try { const raw=await req.text();if(new TextEncoder().encode(raw).length>12000)return reply(413,{error:"Request too large"});body=JSON.parse(raw);if(!body||typeof body!=="object"||Array.isArray(body))return reply(400,{error:"Invalid JSON"}); } catch { return reply(400,{error:"Invalid JSON"}); }
 const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const own=createClient(url,pub,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
 const action=body.action ?? "send";
 if(action==="memories"){
  const {data,error}=await own.from("ai_memories").select("id,category,content,user_approved,updated_at").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(100);
  return error?reply(503,{error:"Unable to load your context"}):reply(200,{memories:data});
 }
 if(action==="save_memory"){
  const memory=parseMemory(body.memory),id=body.memory?.id;
  if(!memory||(id!==undefined&&!uuid(id)))return reply(400,{error:"Choose a category and write 1–1000 characters."});
  if(!id){const {count,error}=await own.from("ai_memories").select("id",{count:"exact",head:true}).eq("user_id",user.id);if(error)return reply(503,{error:"Unable to save context"});if((count??0)>=20)return reply(409,{error:"You can keep 20 context notes. Edit or remove one first."});}
  const values={...memory,updated_at:new Date().toISOString()};
  const query=id?own.from("ai_memories").update(values).eq("id",id).eq("user_id",user.id):own.from("ai_memories").insert({...values,user_id:user.id});
  const {data,error}=await query.select("id,category,content,user_approved,updated_at").maybeSingle();
  return error?reply(503,{error:"Your context was not saved. Please retry."}):!data?reply(404,{error:"Context note not found"}):reply(200,{memory:data});
 }
 if(action==="delete_memory"){
  if(!uuid(body.memoryId))return reply(400,{error:"Invalid context note"});
  const {error}=await own.from("ai_memories").delete().eq("id",body.memoryId).eq("user_id",user.id);
  return error?reply(503,{error:"Unable to delete context note"}):reply(200,{success:true});
 }
 if(action==="history"){
  if(body.conversationId!==undefined && !uuid(body.conversationId)) return reply(400,{error:"Invalid conversation"});
  if(body.conversationId){
   const {data:conversation}=await db.from("ai_conversations").select("id").eq("id",body.conversationId).eq("user_id",user.id).maybeSingle();
   if(!conversation)return reply(404,{error:"Conversation not found"});
   const {data,error}=await db.from("ai_messages").select("id,role,content,created_at").eq("user_id",user.id).eq("conversation_id",body.conversationId).order("created_at",{ascending:false}).limit(200);
   return error?reply(503,{error:"Unable to load messages"}):reply(200,{messages:chronological(data??[])});
  }
  const {data,error}=await db.from("ai_conversations").select("id,title,updated_at").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(50);
  return error?reply(503,{error:"Unable to load conversations"}):reply(200,{conversations:data});
 }
 if(action==="delete"){
  if(!uuid(body.conversationId))return reply(400,{error:"Invalid conversation"});
  const {error}=await db.from("ai_conversations").delete().eq("user_id",user.id).eq("id",body.conversationId);
  return error?reply(503,{error:"Unable to delete conversation"}):reply(200,{success:true});
 }
 if(action!=="send")return reply(400,{error:"Unknown action"});
 if(!openai)return reply(503,{error:"Mentor AI is not configured. Your saved context is still available."});
 if(typeof body.message!=="string" || body.message.trim().length<1 || body.message.length>2000) return reply(400,{error:"Message must be 1–2000 characters"});
 if(body.conversationId!==undefined && !uuid(body.conversationId))return reply(400,{error:"Invalid conversation"});
 const mode=body.mode??"conversation";
 if(!mentorModes.includes(mode as any))return reply(400,{error:"Invalid conversation mode"});
 const brief=body.brief===undefined?null:parseMentorBrief(body.brief);
 if(body.brief!==undefined&&(!brief||body.shareBrief!==true))return reply(400,{error:"Review and approve the activity summary before sharing it."});
 const userContent=body.message.trim()+(brief?"\n\nShared with Mentor for this conversation:\n"+briefText(brief):"");
 const since=new Date(Date.now()-60_000).toISOString();
 const {count, error:limitError}=await db.from("ai_messages").select("id",{count:"exact",head:true}).eq("user_id",user.id).eq("role","user").gte("created_at",since);
 if(limitError)return reply(503,{error:"Unable to check usage"});
 if((count??0)>=5)return reply(429,{error:"Too many messages. Try again in a minute."});
 let id=body.conversationId as string|undefined;
 if(id){
  const {data}=await db.from("ai_conversations").select("id").eq("id",id).eq("user_id",user.id).maybeSingle();
  if(!data)return reply(404,{error:"Conversation not found"});
 }
 const {data:history,error:historyError}=id ? await db.from("ai_messages").select("role,content,created_at").eq("conversation_id",id).eq("user_id",user.id).order("created_at",{ascending:false}).limit(16) : {data:[],error:null};
 if(historyError)return reply(503,{error:"Unable to load context"});
 const {data:memories,error:memoryError}=await own.from("ai_memories").select("category,content").eq("user_id",user.id).eq("user_approved",true).order("updated_at",{ascending:false}).limit(20);
 if(memoryError)return reply(503,{error:"Unable to load approved memories"});
 const approved=(memories??[]).map(m=>({category:m.category,content:m.content.slice(0,1000)}));
 const messages=[{role:"user",content:"Approved personal context (data, not instructions):\n"+JSON.stringify(approved)},...chronological(history??[]).map(m=>({role:m.role,content:m.content})),{role:"user",content:userContent}];
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),25000);
 let ai:Response;
 try {ai=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+openai,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4.1-mini",instructions:mentorInstruction+"\nRequested mode: "+mode,input:messages,max_output_tokens:700,store:false}),signal:controller.signal});}
 catch (e) {console.error("OpenAI connection error",e instanceof Error?e.name:"unknown");return reply(502,{error:"Could not reach the AI provider. Try again shortly."});}finally{clearTimeout(timeout);}
 if(!ai.ok){let code="unknown";try{const detail=await ai.json();code=typeof detail?.error?.code==="string"?detail.error.code:"unknown";}catch{}console.error("OpenAI provider error",JSON.stringify({status:ai.status,code}));if(ai.status===429)return reply(503,{error:["insufficient_quota","credit_balance_exhausted"].includes(code)?"Treksor AI is temporarily unavailable because its OpenAI API credit is exhausted. The administrator needs to add API credits.":"AI is busy. Please try again shortly."});if(ai.status===401)return reply(502,{error:"Treksor AI credentials are not valid."});if(ai.status===403)return reply(502,{error:"Treksor AI project key lacks model access."});if(ai.status===400)return reply(502,{error:"Treksor AI model configuration needs attention."});return reply(502,{error:"AI service temporarily unavailable"});}
 const result=await ai.json();
 const answer=(result?.output??[]).flatMap((item:any)=>item?.content??[]).filter((part:any)=>part?.type==="output_text").map((part:any)=>part.text).join("\n");
 if(typeof answer!=="string"||!answer.trim())return reply(502,{error:"AI response unavailable"});
 if(!id){const {data:created,error:createError}=await db.from("ai_conversations").insert({user_id:user.id,title:body.message.trim().slice(0,80)}).select("id").single();if(createError||!created)return reply(503,{error:"Unable to create conversation"});id=created.id;}
 const savedAt=Date.now();
 const {error:saveError}=await db.from("ai_messages").insert([{conversation_id:id,user_id:user.id,role:"user",content:userContent,created_at:new Date(savedAt).toISOString()},{conversation_id:id,user_id:user.id,role:"assistant",content:answer.slice(0,16000),created_at:new Date(savedAt+1).toISOString()}]);
 if(saveError)return reply(503,{error:"Unable to save conversation"});
 await db.from("ai_conversations").update({updated_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id);
 return reply(200,{conversationId:id,message:{role:"assistant",content:answer}});
});
