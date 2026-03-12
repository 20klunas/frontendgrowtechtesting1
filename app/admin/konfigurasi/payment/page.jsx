'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import SectionCard from '../../../components/admin/SectionCard'

const API = process.env.NEXT_PUBLIC_API_URL

export default function PaymentPage() {

const token = Cookies.get('token')

/* =========================================================
GLOBAL FEE STATE
========================================================= */

const [loading,setLoading] = useState(true)
const [percent,setPercent] = useState(null)
const [editPercent,setEditPercent] = useState('')
const [isPublic,setIsPublic] = useState(true)
const [savingPercent,setSavingPercent] = useState(false)

/* =========================================================
GATEWAY STATES
========================================================= */

const [gateways,setGateways] = useState([])
const [gatewayLoading,setGatewayLoading] = useState(true)

const [search,setSearch] = useState('')
const [scope,setScope] = useState('')
const [page,setPage] = useState(1)
const [lastPage,setLastPage] = useState(1)

const [toast,setToast] = useState(null)
const [error,setError] = useState(null)

/* =========================================================
MODAL STATE
========================================================= */

const [showModal,setShowModal] = useState(false)
const [editingGateway,setEditingGateway] = useState(null)
const [savingGateway,setSavingGateway] = useState(false)

/* =========================================================
FORM STATE
========================================================= */

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

config:{
simulate:false
},

secret_config:{
server_key:'',
client_key:'',
merchant_id:''
}

}

const [form,setForm] = useState(emptyForm)

/* =========================================================
FETCH INITIAL
========================================================= */

useEffect(()=>{
fetchSetting()
fetchGateways()
},[])

/* =========================================================
FETCH GLOBAL FEE
========================================================= */

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

}finally{

setLoading(false)

}

}

/* =========================================================
FETCH GATEWAYS
========================================================= */

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
}
)

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

/* =========================================================
SAVE GLOBAL FEE
========================================================= */

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
}
)

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

/* =========================================================
FORM HANDLERS
========================================================= */

const setField = (key,val)=>{
setForm(prev=>({...prev,[key]:val}))
}

const setSecret = (key,val)=>{
setForm(prev=>({
...prev,
secret_config:{
...prev.secret_config,
[key]:val
}
}))
}

/* =========================================================
PROVIDER AUTO CONFIG
========================================================= */

const handleProviderChange = (provider)=>{

let driver = provider

let config = { simulate:false }

if(provider === 'duitku'){
driver = 'duitku'
}

if(provider === 'midtrans'){
driver = 'midtrans'
}

setForm(prev=>({
...prev,
provider,
driver,
config
}))

}

/* =========================================================
CREATE / UPDATE
========================================================= */

const saveGateway = async () => {

setSavingGateway(true)

try{

const url = editingGateway
? `${API}/api/v1/admin/payment-gateways/${editingGateway.code}`
: `${API}/api/v1/admin/payment-gateways`

const method = editingGateway ? 'PATCH' : 'POST'

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

/* =========================================================
DELETE
========================================================= */

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

/* =========================================================
EDIT
========================================================= */

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

/* =========================================================
INLINE FEE EDIT
========================================================= */

const updateFee = (id,val)=>{

setGateways(prev =>
prev.map(g =>
g.id === id ? {...g,fee_value:val} : g
)
)

}

/* =========================================================
TOAST
========================================================= */

const showToast = (msg)=>{

setToast(msg)

setTimeout(()=>{
setToast(null)
},3000)

}

/* =========================================================
COPY KEY
========================================================= */

const copyKey = (text)=>{

navigator.clipboard.writeText(text)

showToast('Copied')

}

/* =========================================================
MASK SECRET
========================================================= */

const mask = (str)=>{

if(!str) return ''

return str.slice(0,4) + '****' + str.slice(-4)

}

/* =========================================================
UI
========================================================= */

return (

<div className="space-y-8 pb-16">

{/* =========================================================
GLOBAL FEE
========================================================= */}

<SectionCard title="Payment Fee Configuration">

{loading ? (

<div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded"/>

):(

<div className="space-y-6">

<div>

<p className="text-sm text-gray-500 dark:text-gray-400">
Current Fee
</p>

<p className="text-3xl font-bold text-gray-900 dark:text-white">
{percent}%
</p>

</div>

<div className="flex flex-wrap gap-3 items-center">

<input
type="number"
value={editPercent}
onChange={(e)=>setEditPercent(e.target.value)}
className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 rounded w-32"
/>

<label className="flex items-center gap-2 text-sm">

<input
type="checkbox"
checked={isPublic}
onChange={(e)=>setIsPublic(e.target.checked)}
/>

Public

</label>

<button
onClick={handleSavePercent}
disabled={savingPercent}
className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"

>

{savingPercent ? 'Saving...' : 'Save'}

</button>

</div>

</div>

)}

</SectionCard>

{/* =========================================================
PAYMENT GATEWAYS
========================================================= */}

<SectionCard title="Payment Gateways">

<div className="flex flex-wrap gap-3 mb-6">

<input
placeholder="Search gateway..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 rounded"
/>

<select
value={scope}
onChange={(e)=>setScope(e.target.value)}
className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 rounded"

>

<option value="">All Scope</option>
<option value="order">Order</option>
<option value="topup">Topup</option>

</select>

<button
onClick={()=>{

setForm(emptyForm)
setEditingGateway(null)
setShowModal(true)

}}
className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"

>

Add Gateway

</button>

</div>

{/* TABLE */}

<div className="overflow-x-auto">

<table className="w-full text-sm">

<thead>

<tr className="border-b border-gray-200 dark:border-gray-700">

<th className="text-left py-2">Name</th>
<th>Provider</th>
<th>Fee</th>
<th>Status</th>
<th>Default</th>
<th></th>

</tr>

</thead>

<tbody>

{gatewayLoading && (

<tr>
<td colSpan="6" className="py-10 text-center text-gray-400">
Loading...
</td>
</tr>

)}

{gateways.map(g => (

<tr key={g.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">

<td className="py-3">

<div className="font-medium text-gray-900 dark:text-white">
{g.name}
</div>

<div className="text-xs text-gray-500">
{g.code}
</div>

</td>

<td>{g.provider}</td>

<td>

<input
type="number"
value={g.fee_value}
onChange={(e)=>updateFee(g.id,e.target.value)}
className="w-20 border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1 rounded"
/>

{g.fee_type === 'percent' ? '%' : ' IDR'}

</td>

<td>

<span className={`px-2 py-1 text-xs rounded
${g.is_active
? 'bg-green-600 text-white'
: 'bg-gray-500 text-white'}`}>
{g.is_active ? 'Active':'Disabled'} </span>

</td>

<td>

{g.is_default_order && ( <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded mr-1">
Order </span>
)}

{g.is_default_topup && ( <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
Topup </span>
)}

</td>

<td className="space-x-2">

<button
onClick={()=>editGateway(g)}
className="text-blue-500 hover:underline"

>

Edit

</button>

<button
onClick={()=>deleteGateway(g.code)}
className="text-red-500 hover:underline"

>

Delete

</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

</SectionCard>

{/* =========================================================
MODAL
========================================================= */}

{showModal && (

<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">

<div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl overflow-y-auto max-h-[90vh] shadow-xl">

<h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
{editingGateway ? 'Edit Gateway' : 'Create Gateway'}
</h3>

<div className="space-y-4">

<input
placeholder="Code"
value={form.code}
onChange={(e)=>setField('code',e.target.value)}
className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 rounded"
/>

<input
placeholder="Name"
value={form.name}
onChange={(e)=>setField('name',e.target.value)}
className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 rounded"
/>

<select
value={form.provider}
onChange={(e)=>handleProviderChange(e.target.value)}
className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 rounded"

>

<option value="midtrans">Midtrans</option>
<option value="duitku">Duitku</option>

</select>

<input
placeholder="Driver"
value={form.driver}
onChange={(e)=>setField('driver',e.target.value)}
className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 rounded"
/>

{/* SECRET */}

<h4 className="font-semibold text-gray-900 dark:text-white">
Secret Config
</h4>

<div className="flex gap-2">

<input
placeholder="Server Key"
value={form.secret_config.server_key}
onChange={(e)=>setSecret('server_key',e.target.value)}
className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 rounded"
/>

<button
onClick={()=>copyKey(form.secret_config.server_key)}
className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded"

>

Copy

</button>

</div>

</div>

<div className="flex gap-3 pt-6">

<button
onClick={saveGateway}
className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"

>

Save

</button>

<button
onClick={()=>setShowModal(false)}
className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"

>

Cancel

</button>

</div>

</div>

</div>

)}

{/* =========================================================
TOAST
========================================================= */}

{toast && (

<div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-bounce">

{toast}

</div>

)}

</div>

)

}
