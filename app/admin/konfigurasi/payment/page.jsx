'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import SectionCard from '../../../components/admin/SectionCard'

const API = process.env.NEXT_PUBLIC_API_URL

export default function PaymentPage(){

const token = Cookies.get('token')

/* ======================================================
GLOBAL FEE
====================================================== */

const [loading,setLoading] = useState(true)
const [percent,setPercent] = useState(null)
const [editPercent,setEditPercent] = useState('')
const [isPublic,setIsPublic] = useState(true)
const [savingPercent,setSavingPercent] = useState(false)

/* ======================================================
GATEWAY STATE
====================================================== */

const [gateways,setGateways] = useState([])
const [gatewayLoading,setGatewayLoading] = useState(true)

const [search,setSearch] = useState('')
const [scope,setScope] = useState('')
const [page,setPage] = useState(1)
const [lastPage,setLastPage] = useState(1)

const [toast,setToast] = useState(null)
const [error,setError] = useState(null)

/* ======================================================
MODAL
====================================================== */

const [showModal,setShowModal] = useState(false)
const [editingGateway,setEditingGateway] = useState(null)
const [savingGateway,setSavingGateway] = useState(false)

/* ======================================================
FORM
====================================================== */

const emptyForm = {

code:'',
name:'',
provider:'midtrans',
driver:'midtrans',
description:'',

is_active:true,
is_default_order:false,
is_default_topup:false,

supports_order:true,
supports_topup:true,

sandbox_mode:true,

fee_type:'percent',
fee_value:0,

sort_order:0,

config:{},

secret_config:{}

}

const [form,setForm] = useState(emptyForm)

/* ======================================================
INIT
====================================================== */

useEffect(()=>{
fetchSetting()
fetchGateways()
},[])

/* ======================================================
FETCH GLOBAL FEE
====================================================== */

const fetchSetting = async () => {

try{

const res = await fetch(`${API}/api/v1/admin/settings`,{
headers:{
Authorization:`Bearer ${token}`,
Accept:'application/json'
}
})

const json = await res.json()

if(json.success){

const setting = json.data.find(
i => i.group === 'payment' && i.key === 'fee_percent'
)

if(setting){

setPercent(setting.value.percent)
setEditPercent(setting.value.percent)
setIsPublic(setting.is_public ?? true)

}

}

}catch(err){
console.error(err)
}

setLoading(false)

}

/* ======================================================
FETCH GATEWAYS
====================================================== */

const fetchGateways = async () => {

setGatewayLoading(true)

try{

const params = new URLSearchParams({
q:search,
scope:scope,
page:page,
per_page:10
})

const res = await fetch(
`${API}/api/v1/admin/payment-gateways?${params}`,
{
headers:{
Authorization:`Bearer ${token}`
}
})

const json = await res.json()

if(json.success){

setGateways(json.data.data)
setLastPage(json.data.last_page)

}

}catch(err){
console.error(err)
}

setGatewayLoading(false)

}

useEffect(()=>{
fetchGateways()
},[search,scope,page])

/* ======================================================
SAVE GLOBAL FEE
====================================================== */

const handleSavePercent = async () => {

const numeric = parseFloat(editPercent)

if(isNaN(numeric) || numeric < 0 || numeric > 100){

setError('Fee harus 0 - 100')
return

}

setSavingPercent(true)

try{

const res = await fetch(
`${API}/api/v1/admin/settings/upsert`,
{
method:'POST',
headers:{
Authorization:`Bearer ${token}`,
'Content-Type':'application/json'
},
body:JSON.stringify({
group:'payment',
key:'fee_percent',
value:{percent:numeric},
is_public:isPublic
})
})

const json = await res.json()

if(json.success){

setPercent(numeric)
showToast('Fee berhasil disimpan')

}

}catch(err){
console.error(err)
}

setSavingPercent(false)

}

/* ======================================================
FORM
====================================================== */

const setField = (key,val)=>{

setForm(prev=>({...prev,[key]:val}))

}

/* ======================================================
CONFIG HANDLERS
====================================================== */

const updateConfigKey = (oldKey,newKey)=>{

const updated = {...form.config}

updated[newKey] = updated[oldKey]

delete updated[oldKey]

setForm({...form,config:updated})

}

const updateConfigValue = (key,val)=>{

setForm({
...form,
config:{
...form.config,
[key]:val
}
})

}

const addConfig = ()=>{

setForm({
...form,
config:{
...form.config,
new_key:''
}
})

}

const removeConfig = (key)=>{

const updated = {...form.config}

delete updated[key]

setForm({...form,config:updated})

}

/* ======================================================
SECRET CONFIG
====================================================== */

const updateSecretKey = (oldKey,newKey)=>{

const updated = {...form.secret_config}

updated[newKey] = updated[oldKey]

delete updated[oldKey]

setForm({...form,secret_config:updated})

}

const updateSecretValue = (key,val)=>{

setForm({
...form,
secret_config:{
...form.secret_config,
[key]:val
}
})

}

const addSecret = ()=>{

setForm({
...form,
secret_config:{
...form.secret_config,
new_secret:''
}
})

}

const removeSecret = (key)=>{

const updated = {...form.secret_config}

delete updated[key]

setForm({...form,secret_config:updated})

}

/* ======================================================
SAVE GATEWAY
====================================================== */

const saveGateway = async () => {

setSavingGateway(true)

try{

const url = editingGateway
? `${API}/api/v1/admin/payment-gateways/${editingGateway.code}`
: `${API}/api/v1/admin/payment-gateways`

const method = editingGateway ? 'PATCH':'POST'

const res = await fetch(url,{
method,
headers:{
Authorization:`Bearer ${token}`,
'Content-Type':'application/json'
},
body:JSON.stringify(form)
})

const json = await res.json()

if(json.success){

showToast('Gateway berhasil disimpan')

fetchGateways()

setShowModal(false)

setForm(emptyForm)

setEditingGateway(null)

}

}catch(err){
console.error(err)
}

setSavingGateway(false)

}

/* ======================================================
DELETE
====================================================== */

const deleteGateway = async (code)=>{

if(!confirm('Hapus gateway ini?')) return

try{

const res = await fetch(
`${API}/api/v1/admin/payment-gateways/${code}`,
{
method:'DELETE',
headers:{
Authorization:`Bearer ${token}`
}
}
)

const json = await res.json()

if(json.success){

showToast('Gateway berhasil dihapus')
fetchGateways()

}

}catch(err){
console.error(err)
}

}

/* ======================================================
EDIT
====================================================== */

const editGateway = async (gateway) => {

try{

const res = await fetch(
`${API}/api/v1/admin/payment-gateways/${gateway.code}`,
{
headers:{
Authorization:`Bearer ${token}`
}
}
)

const json = await res.json()

if(json.success){

setForm(json.data)
setEditingGateway(gateway)
setShowModal(true)

}

}catch(err){
console.error(err)
}

}

/* ======================================================
TOAST
====================================================== */

const showToast = (msg)=>{

setToast(msg)

setTimeout(()=>{
setToast(null)
},3000)

}

/* ======================================================
UI
====================================================== */

return(

<div className="space-y-8 pb-16">

{/* ======================================================
PAYMENT GATEWAYS
====================================================== */}

<SectionCard title="Payment Gateways">

<div className="flex justify-between mb-6">

<input
placeholder="Search gateway..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="border px-3 py-2 rounded bg-transparent"
/>

<button
onClick={()=>{

setForm(emptyForm)
setEditingGateway(null)
setShowModal(true)

}}
className="bg-green-600 text-white px-4 py-2 rounded"
>
Add Gateway
</button>

</div>

<table className="w-full text-sm">

<thead>
<tr className="border-b">
<th className="text-left py-2">Name</th>
<th>Provider</th>
<th>Fee</th>
<th>Status</th>
<th></th>
</tr>
</thead>

<tbody>

{gateways.map(g=>(
<tr key={g.id} className="border-b">

<td className="py-2">

<div className="font-medium">
{g.name}
</div>

<div className="text-xs opacity-60">
{g.code}
</div>

</td>

<td>{g.provider}</td>

<td>
{g.fee_value}{g.fee_type === 'percent' ? '%' : ' IDR'}
</td>

<td>
{g.is_active ? 'Active':'Disabled'}
</td>

<td className="space-x-2">

<button
onClick={()=>editGateway(g)}
className="text-blue-500"
>
Edit
</button>

<button
onClick={()=>deleteGateway(g.code)}
className="text-red-500"
>
Delete
</button>

</td>

</tr>
))}

</tbody>

</table>

</SectionCard>

{/* ======================================================
MODAL
====================================================== */}

{showModal && (

<div className="fixed inset-0 bg-black/60 flex items-center justify-center">

<div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-3xl">

<h3 className="text-xl font-semibold mb-4">

{editingGateway ? 'Edit Gateway':'Create Gateway'}

</h3>

<div className="space-y-3">

<input
placeholder="Code"
value={form.code}
onChange={(e)=>setField('code',e.target.value)}
className="w-full border px-3 py-2 rounded"
/>

<input
placeholder="Name"
value={form.name}
onChange={(e)=>setField('name',e.target.value)}
className="w-full border px-3 py-2 rounded"
/>

{/* CONFIG */}

<h4 className="font-semibold mt-4">
Config
</h4>

{Object.entries(form.config).map(([k,v])=>(
<div key={k} className="flex gap-2">

<input
value={k}
onChange={(e)=>updateConfigKey(k,e.target.value)}
className="border px-2 py-1 w-40"
/>

<input
value={v}
onChange={(e)=>updateConfigValue(k,e.target.value)}
className="border px-2 py-1 flex-1"
/>

<button
onClick={()=>removeConfig(k)}
className="text-red-500"
>
X
</button>

</div>
))}

<button
onClick={addConfig}
className="text-sm text-blue-500"
>
+ Add Config
</button>

{/* SECRET CONFIG */}

<h4 className="font-semibold mt-4">
Secret Config
</h4>

{Object.entries(form.secret_config).map(([k,v])=>(
<div key={k} className="flex gap-2">

<input
value={k}
onChange={(e)=>updateSecretKey(k,e.target.value)}
className="border px-2 py-1 w-40"
/>

<input
value={v}
onChange={(e)=>updateSecretValue(k,e.target.value)}
className="border px-2 py-1 flex-1"
/>

<button
onClick={()=>removeSecret(k)}
className="text-red-500"
>
X
</button>

</div>
))}

<button
onClick={addSecret}
className="text-sm text-blue-500"
>
+ Add Secret
</button>

<div className="flex gap-3 pt-4">

<button
onClick={saveGateway}
className="bg-blue-600 text-white px-4 py-2 rounded"
>
Save
</button>

<button
onClick={()=>setShowModal(false)}
className="bg-gray-500 text-white px-4 py-2 rounded"
>
Cancel
</button>

</div>

</div>

</div>

</div>

)}

{toast && (
<div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded">
{toast}
</div>
)}

</div>

)

}