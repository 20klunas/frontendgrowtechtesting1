'use client'

import { useEffect, useState, useMemo } from "react"

import {
  Copy,
  CheckCircle,
  Loader2,
  AlertCircle,
  Wallet,
  Users,
  TrendingUp,
  Gift,
  ArrowUpRight,
  Sparkles,
  Share2,
  Crown,
  Clock,
  Network
} from "lucide-react"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar
} from "recharts"

import { motion } from "framer-motion"

import { authFetch } from "../../lib/authFetch"



/* =========================================================
BACKGROUND ANIMATION
========================================================= */

const backgroundGlow = {
  animate: {
    opacity: [0.25,0.5,0.25],
    scale:[1,1.08,1]
  },
  transition:{
    duration:7,
    repeat:Infinity
  }
}

const fadeUp = {
  hidden:{opacity:0,y:25},
  show:{
    opacity:1,
    y:0,
    transition:{duration:.4}
  }
}



/* =========================================================
MAIN PAGE
========================================================= */

export default function ReferralPage(){

  const [dashboard,setDashboard]=useState(null)
  const [loading,setLoading]=useState(true)

  const [withdrawHistory,setWithdrawHistory]=useState([])
  const [withdrawLoadingHistory,setWithdrawLoadingHistory]=useState(false)

  const [attachCode,setAttachCode]=useState("")
  const [attachLoading,setAttachLoading]=useState(false)
  const [attachMessage,setAttachMessage]=useState(null)

  const [previewAmount,setPreviewAmount]=useState(100000)
  const [preview,setPreview]=useState(null)
  const [previewLoading,setPreviewLoading]=useState(false)

  const [withdrawAmount,setWithdrawAmount]=useState("")
  const [withdrawLoading,setWithdrawLoading]=useState(false)
  const [withdrawMessage,setWithdrawMessage]=useState(null)



/* =========================================================
INIT + AUTO REFRESH (simulate realtime)
========================================================= */

useEffect(()=>{

 fetchDashboard()
 fetchWithdrawHistory()

 const interval=setInterval(()=>{
  fetchWithdrawHistory()
 },20000)

 return ()=>clearInterval(interval)

},[])



/* =========================================================
FETCH DASHBOARD
========================================================= */

async function fetchDashboard(){

 try{

  setLoading(true)

  const json=await authFetch(`/api/v1/referral`)

  setDashboard(json.data)

 }catch(err){
  console.error(err)
 }finally{
  setLoading(false)
 }

}



/* =========================================================
FETCH WITHDRAW HISTORY
========================================================= */

async function fetchWithdrawHistory(){

 try{

  setWithdrawLoadingHistory(true)

  const json=await authFetch(`/api/v1/withdraws`)

  setWithdrawHistory(json.data?.data || [])

 }catch(err){
  console.error(err)
 }finally{
  setWithdrawLoadingHistory(false)
 }

}



/* =========================================================
ANALYTICS
========================================================= */

const analytics=useMemo(()=>{

 const total=withdrawHistory.reduce((s,w)=>s+Number(w.amount),0)

 const approved=withdrawHistory
  .filter(w=>w.status==="approved")
  .reduce((s,w)=>s+Number(w.amount),0)

 const pending=withdrawHistory
  .filter(w=>w.status==="pending")
  .reduce((s,w)=>s+Number(w.amount),0)

 return{
  total,
  approved,
  pending,
  withdrawCount:withdrawHistory.length
 }

},[withdrawHistory])



/* =========================================================
CHART DATA
========================================================= */

const chartData=withdrawHistory.map(w=>({

 date:new Date(w.created_at).toLocaleDateString(),
 amount:Number(w.amount)

}))



/* =========================================================
LEADERBOARD DATA (LOCAL)
========================================================= */

const leaderboard=useMemo(()=>{

 const sorted=[...withdrawHistory]
  .sort((a,b)=>b.amount-a.amount)
  .slice(0,5)

 return sorted.map((x,i)=>({
  rank:i+1,
  amount:x.amount
 }))

},[withdrawHistory])



/* =========================================================
TIMELINE
========================================================= */

const timeline=withdrawHistory.slice(0,6)



/* =========================================================
PROGRESS (goal visual)
========================================================= */

const commissionGoal=1000000
const progress=Math.min((analytics.total/commissionGoal)*100,100)



/* =========================================================
REFERRAL LINK
========================================================= */

const referralCode=dashboard?.my_referral_code

const referralLink=`${typeof window!=='undefined'?window.location.origin:''}/register?ref=${referralCode}`



/* =========================================================
COPY
========================================================= */

function copy(text){

 navigator.clipboard.writeText(text)

 setAttachMessage({
  type:"success",
  text:"Copied!"
 })

}



/* =========================================================
WHATSAPP SHARE
========================================================= */

function shareWhatsapp(){

 const text=`Join using my referral code ${referralCode} ${referralLink}`

 window.open(`https://wa.me/?text=${encodeURIComponent(text)}`)

}



/* =========================================================
ATTACH
========================================================= */

async function handleAttach(){

 if(!attachCode)return

 try{

  setAttachLoading(true)

  const json=await authFetch(`/api/v1/referral/attach`,{
   method:"POST",
   body:JSON.stringify({code:attachCode})
  })

  setAttachMessage({type:"success",text:json.message})

  fetchDashboard()

  setAttachCode("")

 }catch(err){

  setAttachMessage({type:"error",text:err.message})

 }finally{
  setAttachLoading(false)
 }

}



/* =========================================================
PREVIEW
========================================================= */

async function handlePreview(){

 try{

  setPreviewLoading(true)

  const json=await authFetch(`/api/v1/referral/preview-discount`,{
   method:"POST",
   body:JSON.stringify({amount:previewAmount})
  })

  setPreview(json.data)

 }finally{
  setPreviewLoading(false)
 }

}



/* =========================================================
WITHDRAW
========================================================= */

async function handleWithdraw(){

 if(!withdrawAmount)return

 try{

  setWithdrawLoading(true)

  const json=await authFetch(`/api/v1/withdraws`,{
   method:"POST",
   body:JSON.stringify({
    amount:Number(withdrawAmount)
   })
  })

  setWithdrawMessage({
   type:"success",
   text:json.message
  })

  setWithdrawAmount("")

  fetchWithdrawHistory()

 }catch(err){

  setWithdrawMessage({
   type:"error",
   text:err.message
  })

 }finally{
  setWithdrawLoading(false)
 }

}



/* =========================================================
LOADING
========================================================= */

if(loading){

 return(

  <div className="h-screen flex justify-center items-center text-purple-400">

   <Loader2 className="animate-spin w-12 h-12"/>

  </div>

 )

}



/* =========================================================
UI
========================================================= */

return(

<motion.section
 initial="hidden"
 animate="show"
 variants={fadeUp}
 className="relative max-w-7xl mx-auto px-4 md:px-8 py-12 text-white"
>

{/* Glow Background */}

<motion.div
 variants={backgroundGlow}
 animate="animate"
 className="absolute blur-[140px] bg-purple-600 opacity-30 w-[500px] h-[500px] -top-40 -left-40 rounded-full"
/>

<motion.div
 variants={backgroundGlow}
 animate="animate"
 className="absolute blur-[120px] bg-fuchsia-600 opacity-30 w-[400px] h-[400px] bottom-0 right-0 rounded-full"
/>



{/* TITLE */}

<h1 className="text-3xl md:text-4xl font-bold mb-10 flex items-center gap-2">

<Sparkles className="text-purple-400"/>
Referral Dashboard

</h1>



{/* STATS */}

<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">

<StatCard icon={<Gift size={20}/>} label="Total Earnings" value={`Rp ${analytics.total.toLocaleString()}`}/>
<StatCard icon={<Wallet size={20}/>} label="Approved" value={`Rp ${analytics.approved.toLocaleString()}`}/>
<StatCard icon={<AlertCircle size={20}/>} label="Pending" value={`Rp ${analytics.pending.toLocaleString()}`}/>
<StatCard icon={<Users size={20}/>} label="Withdraw Count" value={analytics.withdrawCount}/>

</div>



{/* REFERRAL LINK */}

<Card>

<h3 className="font-semibold mb-3 flex items-center gap-2">

<Share2 size={18}/>
Share Your Referral Link

</h3>

<p className="text-sm text-gray-400 mb-3">
Share this link with friends. When they register and purchase, you earn commission.
</p>

<div className="flex gap-2">

<input
readOnly
value={referralLink}
className="flex-1 bg-purple-900/40 border border-purple-700 px-4 py-2 rounded-xl"
/>

<button
onClick={()=>copy(referralLink)}
className="border border-purple-700 px-4 rounded-xl"
>

<Copy size={16}/>

</button>

<button
onClick={shareWhatsapp}
className="bg-green-600 px-4 rounded-xl"
>

WhatsApp

</button>

</div>

</Card>



{/* COMMISSION PROGRESS */}

<Card className="mt-6">

<h3 className="mb-3 font-semibold flex items-center gap-2">

<TrendingUp size={18}/>
Commission Progress

</h3>

<p className="text-sm text-gray-400 mb-3">
Goal example to motivate referrals.
</p>

<div className="w-full bg-purple-900/40 rounded-full h-3">

<div
style={{width:`${progress}%`}}
className="h-3 bg-purple-500 rounded-full"
/>

</div>

<p className="text-xs mt-2 text-gray-400">

Rp {analytics.total.toLocaleString()} / Rp {commissionGoal.toLocaleString()}

</p>

</Card>



{/* EARNINGS CHART */}

<Card className="mt-8">

<h3 className="mb-4 font-semibold">Earnings Chart</h3>

<div className="h-[300px]">

<ResponsiveContainer width="100%" height="100%">

<LineChart data={chartData}>

<CartesianGrid strokeDasharray="3 3" stroke="#6b21a8"/>

<XAxis dataKey="date"/>

<YAxis/>

<Tooltip/>

<Line
type="monotone"
dataKey="amount"
stroke="#9333ea"
strokeWidth={3}
dot={false}
/>

</LineChart>

</ResponsiveContainer>

</div>

</Card>



{/* LEADERBOARD */}

<Card className="mt-8">

<h3 className="font-semibold mb-4 flex items-center gap-2">

<Crown size={18}/>
Top Withdraws

</h3>

<ResponsiveContainer width="100%" height={250}>

<BarChart data={leaderboard}>

<XAxis dataKey="rank"/>
<YAxis/>
<Tooltip/>

<Bar dataKey="amount" fill="#9333ea"/>

</BarChart>

</ResponsiveContainer>

</Card>



{/* NETWORK GRAPH */}

<Card className="mt-8">

<h3 className="font-semibold mb-4 flex items-center gap-2">

<Network size={18}/>
Referral Network

</h3>

<p className="text-sm text-gray-400">
Each user who signs up with your referral contributes to your network.
</p>

<div className="flex gap-4 mt-4 flex-wrap">

{withdrawHistory.slice(0,6).map((x,i)=>(

<div
key={i}
className="w-14 h-14 rounded-full bg-purple-700 flex items-center justify-center text-xs"
>

U{i+1}

</div>

))}

</div>

</Card>



{/* TIMELINE */}

<Card className="mt-8">

<h3 className="font-semibold mb-4 flex items-center gap-2">

<Clock size={18}/>
Referral Earnings Timeline

</h3>

<div className="space-y-3">

{timeline.map((w)=>(
<div
key={w.id}
className="flex justify-between border border-purple-700 rounded-xl p-3"
>

<span>
Rp {Number(w.amount).toLocaleString()}
</span>

<span className="text-gray-400 text-sm">
{new Date(w.created_at).toLocaleDateString()}
</span>

</div>
))}

</div>

</Card>



{/* WITHDRAW */}

<Card className="mt-8">

<h3 className="mb-3 font-semibold">
Withdraw Commission
</h3>

<div className="flex gap-2">

<input
type="number"
value={withdrawAmount}
onChange={(e)=>setWithdrawAmount(e.target.value)}
className="flex-1 rounded-xl bg-purple-900/40 border border-purple-700 px-4 py-2"
/>

<button
onClick={handleWithdraw}
className="bg-purple-700 px-4 rounded-xl"
>

{withdrawLoading ? <Loader2 className="animate-spin"/> : "Withdraw"}

</button>

</div>

</Card>



</motion.section>

)

}



/* =========================================================
COMPONENTS
========================================================= */

function Card({children,className=""}){

return(

<motion.div
whileHover={{scale:1.01}}
className={`rounded-2xl border border-purple-700 bg-black/70 backdrop-blur p-6 ${className}`}
>

{children}

</motion.div>

)

}



function StatCard({icon,label,value}){

return(

<motion.div
whileHover={{scale:1.05}}
className="border border-purple-700 rounded-xl p-4 bg-black/60 backdrop-blur"
>

<div className="flex items-center gap-2 mb-2 text-purple-400">
{icon}
</div>

<p className="text-xs text-gray-400">
{label}
</p>

<p className="font-semibold text-lg">
{value}
</p>

</motion.div>

)

}