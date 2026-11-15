import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {useAuthStore} from "@/store/auth-store";
import {addGrocery,checkGrocery,listGroceries,removeGrocery,type Grocery} from "@/api/groceries";
import {colors} from "@/theme/architect";
import React,{useCallback,useState} from "react";
import {ActivityIndicator,Alert,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

export default function GroceryList(){
 const insets=useSafeAreaInsets(),owner=useAuthStore(s=>s.isAuthenticated?s.user?.id:undefined);
 const [items,setItems]=useState<Grocery[]>([]),[draft,setDraft]=useState(""),[loading,setLoading]=useState(true),[working,setWorking]=useState<string|null>(null),[error,setError]=useState("");
 const reload=useCallback(async()=>{if(!owner){setItems([]);setLoading(false);return}setLoading(true);setError("");try{setItems(await listGroceries(owner))}catch(e){setError(e instanceof Error?e.message:"Unable to load groceries")}finally{setLoading(false)}},[owner]);
 useFocusEffect(useCallback(()=>{void reload()},[reload]));
 const change=async(task:string,fn:()=>Promise<unknown>)=>{if(!owner||working)return;setWorking(task);setError("");try{await fn();await reload()}catch(e){setError(e instanceof Error?e.message:"Unable to save. Try again.")}finally{setWorking(null)}};
 const unchecked=items.filter(x=>!x.checked),checked=items.filter(x=>x.checked);
 return <ScrollView keyboardShouldPersistTaps="handled" style={{flex:1,backgroundColor:colors.background}} contentContainerStyle={{paddingHorizontal:20,paddingTop:insets.top+12,paddingBottom:insets.bottom+48,gap:14}}>
  <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={()=>router.back()} style={{height:44,width:44,justifyContent:"center"}}><Ionicons name="arrow-back" size={23} color={colors.text}/></Pressable>
  <Text style={{color:colors.gold,letterSpacing:1.7,fontSize:11,fontWeight:"700"}}>BODY / NUTRITION</Text><Text style={{color:colors.text,fontSize:31,fontWeight:"600"}}>Shopping list</Text>
  <Text style={{color:colors.muted,fontSize:13,lineHeight:19}}>One list for your Treksor account. Open it from the app or website.</Text>
  <View style={{flexDirection:"row",gap:8,alignItems:"center",backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,padding:10,borderRadius:15}}>
   <TextInput accessibilityLabel="Add a grocery item" value={draft} onChangeText={setDraft} maxLength={100} placeholder="What do you need?" placeholderTextColor={colors.muted} returnKeyType="done" onSubmitEditing={()=>{if(owner&&draft.trim())void change("add",()=>addGrocery(owner,draft).then(()=>setDraft("")))}} style={{flex:1,color:colors.text,padding:8,fontSize:15}}/>
   <Pressable accessibilityRole="button" disabled={!owner||!draft.trim()||!!working} onPress={()=>{if(owner)void change("add",()=>addGrocery(owner,draft).then(()=>setDraft("")))}} style={{padding:12,borderRadius:10,backgroundColor:colors.gold,opacity:!draft.trim()?0.45:1}}><Ionicons name="add" color={colors.background} size={21}/></Pressable>
  </View>
  <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}><Text style={{color:colors.text,fontWeight:"600",fontSize:17}}>To buy</Text><Pressable accessibilityRole="button" onPress={()=>void reload()} style={{padding:9}}><Ionicons name="refresh-outline" size={19} color={colors.gold}/></Pressable></View>
  {loading?<ActivityIndicator color={colors.gold}/>:!owner?<Text style={{color:colors.muted}}>Sign in to see your shopping list.</Text>:unchecked.length===0?<Text style={{color:colors.muted,fontSize:13}}>Your list is clear. Add an item above.</Text>:null}
  {unchecked.map(item=><View key={item.id} style={{flexDirection:"row",alignItems:"center",gap:13,backgroundColor:colors.surface,borderRadius:12,borderWidth:1,borderColor:colors.border,padding:14}}>
   <Pressable accessibilityRole="checkbox" accessibilityState={{checked:false,disabled:!!working}} disabled={!!working} onPress={()=>owner&&void change(item.id,()=>checkGrocery(owner,item.id,true))}><Ionicons name="square-outline" size={23} color={colors.gold}/></Pressable>
   <Text style={{color:colors.text,flex:1,fontSize:15}}>{item.name}</Text>
   <Pressable accessibilityRole="button" accessibilityLabel={"Remove "+item.name} onPress={()=>Alert.alert("Delete item?","Remove from your shared list?",[{text:"Cancel",style:"cancel"},{text:"Remove",style:"destructive",onPress:()=>owner&&void change(item.id,()=>removeGrocery(owner,item.id))}])}><Ionicons name="trash-outline" color={colors.muted} size={19}/></Pressable>
  </View>)}
  {!!checked.length&&<Text style={{color:colors.muted,fontSize:15,fontWeight:"600",marginTop:13}}>Purchased · {checked.length}</Text>}
  {checked.map(item=><View key={item.id} style={{flexDirection:"row",alignItems:"center",gap:13,padding:13,borderRadius:12,backgroundColor:colors.surface,borderColor:colors.border,borderWidth:1}}>
   <Pressable accessibilityRole="checkbox" accessibilityState={{checked:true,disabled:!!working}} disabled={!!working} onPress={()=>owner&&void change(item.id,()=>checkGrocery(owner,item.id,false))}><Ionicons name="checkbox" color={colors.gold} size={23}/></Pressable>
   <Text style={{flex:1,color:colors.muted,textDecorationLine:"line-through"}}>{item.name}</Text>
   <Pressable accessibilityRole="button" accessibilityLabel={"Remove "+item.name} onPress={()=>Alert.alert("Delete item?","Remove from your shared list?",[{text:"Cancel",style:"cancel"},{text:"Remove",style:"destructive",onPress:()=>owner&&void change(item.id,()=>removeGrocery(owner,item.id))}])}><Ionicons name="trash-outline" color={colors.muted} size={19}/></Pressable>
  </View>)}
  {!!error&&<Text accessibilityRole="alert" style={{color:colors.danger,fontSize:13}}>{error}</Text>}
  <Text style={{color:colors.muted,fontSize:11,marginTop:10}}>Private to your account · Updated from Supabase on refresh and when you return to this screen. No inventory or order is placed automatically.</Text>
 </ScrollView>;
}
