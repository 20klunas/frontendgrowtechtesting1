'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import SectionCard from '../../../components/admin/SectionCard'

const API = process.env.NEXT_PUBLIC_API_URL

export default function PaymentPage() {

const token = Cookies.get('token')

/* =========================================================
GLOBAL FEE STATES
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
MODAL STATES
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

  config:{},
  secret_config:{}

}

const [form,setForm] = useState(emptyForm)

  /* =========================================================
  INIT
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
      setError("Gagal mengambil setting")

    }finally{

      setLoading(false)

    }

  }

/* ===============================
CONFIG HANDLERS
================================ */

const setConfigField = (key,val)=>{
  setForm(prev=>({
    ...prev,
    config:{
      ...prev.config,
      [key]:val
    }
  }))
}

const removeConfigField = (key)=>{
  setForm(prev=>{
    const copy = {...prev.config}
    delete copy[key]
    return {...prev,config:copy}
  })
}

const addConfigField = ()=>{
  const key = prompt("Config key")

  if(!key || key.trim()==='') return

  if(form.config[key]){
    alert("Key sudah ada")
    return
  }

  setForm(prev=>({
    ...prev,
    config:{
      ...prev.config,
      [key]:''
    }
  }))
}

/* ===============================
SECRET CONFIG
================================ */

const setSecretField = (key,val)=>{
  setForm(prev=>({
    ...prev,
    secret_config:{
      ...prev.secret_config,
      [key]:val
    }
  }))
}

const removeSecretField = (key)=>{
  setForm(prev=>{
    const copy = {...prev.secret_config}
    delete copy[key]
    return {...prev,secret_config:copy}
  })
}

const addSecretField = ()=>{
  const key = prompt("Secret key")

  if(!key || key.trim()==='') return

  if(form.secret_config[key]){
    alert("Key sudah ada")
    return
  }

  setForm(prev=>({
    ...prev,
    secret_config:{
      ...prev.secret_config,
      [key]:''
    }
  }))
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
    })

    const json = await res.json()

    if(json.success){
      setGateways(json.data.data)
      setLastPage(json.data.last_page)
    }

  }catch(err){
    console.error(err)

  }finally{
    setGatewayLoading(false)
  }

}

/* =========================================================
SEARCH EFFECT
========================================================= */

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

const setConfig = (key,val)=>{

setForm(prev=>({
...prev,
config:{
...prev.config,
[key]:val
}
}))

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
CREATE / UPDATE
========================================================= */

const saveGateway = async () => {

if(!form.name){
  setError("Name wajib diisi")
  return
}

if(!form.provider){
  setError("Provider wajib")
  return
}

if(!confirm("Simpan gateway ini?")) return

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

setForm({...emptyForm})
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
TOAST
========================================================= */

const showToast = (msg)=>{

  setError(null)
  setToast(msg)

  setTimeout(()=>{
    setToast(null)
  },3000)

}

/* =========================================================
UI
========================================================= */

return (

<div className="space-y-8 pb-16">
  {error && (
    <div className="bg-red-600 text-white px-4 py-2 rounded">
      {error}
    </div>
  )}

{/* =========================================================
GLOBAL FEE
========================================================= */}

<SectionCard title="Payment Fee Configuration">

{loading ? (

<p className="text-gray-400">Loading...</p>

):(

<div className="space-y-6">

<div>

<p className="text-sm text-gray-400">
Current Fee
</p>

<p className="text-3xl font-bold">
{percent}%
</p>

</div>

<div className="flex flex-wrap gap-3 items-center">

<input
type="number"
value={editPercent}
onChange={(e)=>setEditPercent(e.target.value)}
className="border px-3 py-2 rounded w-32 bg-transparent"
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
className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"

>

{savingPercent ? 'Saving...' : 'Save'} </button>

</div>

</div>

)}

</SectionCard>

{/* =========================================================
PAYMENT GATEWAYS
========================================================= */}

<SectionCard title="Payment Gateways">

{/* Filters */}

<div className="flex flex-wrap gap-3 mb-6">

<input
placeholder="Search gateway..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="border px-3 py-2 rounded bg-transparent"
/>

<select
value={scope}
onChange={(e)=>setScope(e.target.value)}
className="border px-3 py-2 rounded bg-transparent"

>

<option value="">All Scope</option>
<option value="order">Order</option>
<option value="topup">Topup</option>
</select>

<button
onClick={()=>{

setForm({...emptyForm})
setEditingGateway(null)
setShowModal(true)

}}
className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"

>

Add Gateway </button>

</div>

{/* Table */}

<div className="overflow-x-auto">

<table className="w-full text-sm">

<thead>

<tr className="border-b">

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

<td colSpan="6" className="py-6 text-center">
Loading...
</td>

</tr>

)}

{gateways.map(g => (

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

{g.fee_value}
{g.fee_type === 'percent' ? '%' : ' IDR'}

</td>

<td>

<span className={`px-2 py-1 text-xs rounded
${g.is_active ? 'bg-green-600 text-white':'bg-gray-500 text-white'}`}>
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

Edit </button>

<button
onClick={()=>deleteGateway(g.code)}
className="text-red-500 hover:underline"

>

Delete </button>

</td>

</tr>

))}

</tbody>

</table>

</div>

{/* Pagination */}

<div className="flex gap-2 mt-6">

<button
disabled={page===1}
onClick={()=>setPage(p=>p-1)}
className="px-3 py-1 border rounded"

>

Prev </button>

<span className="px-2">
Page {page} / {lastPage}
</span>

<button
disabled={page===lastPage}
onClick={()=>setPage(p=>p+1)}
className="px-3 py-1 border rounded"

>

Next </button>

</div>

</SectionCard>

{/* =========================================================
MODAL FORM
========================================================= */}

{showModal && (

<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">

<div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl overflow-y-auto max-h-[90vh]">

<h3 className="text-xl font-semibold mb-4">
{editingGateway ? 'Edit Gateway' : 'Create Gateway'}
</h3>

<div className="space-y-4">

<input
placeholder="Code"
value={form.code}
disabled={editingGateway}
onChange={(e)=>setField('code',e.target.value)}
className="w-full border px-3 py-2 rounded"
/>

<input
placeholder="Name"
value={form.name}
onChange={(e)=>setField('name',e.target.value)}
className="w-full border px-3 py-2 rounded"
/>

<input
placeholder="Description"
value={form.description}
onChange={(e)=>setField('description',e.target.value)}
className="w-full border px-3 py-2 rounded"
/>

<select
value={form.provider}
onChange={(e)=>setField('provider',e.target.value)}
className="w-full border px-3 py-2 rounded"

>

<option value="midtrans">Midtrans</option>
<option value="duitku">Duitku</option>
<option value="xendit">Xendit</option>

</select>

<input
placeholder="Driver"
value={form.driver}
onChange={(e)=>setField('driver',e.target.value)}
className="w-full border px-3 py-2 rounded"
/>

{/* Gateway Status */}

<div className="flex flex-wrap gap-4">

<label className="flex items-center gap-2">
<input
type="checkbox"
checked={form.is_active}
onChange={(e)=>setField('is_active',e.target.checked)}
/>
Active
</label>

<label className="flex items-center gap-2">
<input
type="checkbox"
checked={form.sandbox_mode}
onChange={(e)=>setField('sandbox_mode',e.target.checked)}
/>
Sandbox
</label>

<label className="flex items-center gap-2">
<input
type="checkbox"
checked={form.supports_order}
onChange={(e)=>setField('supports_order',e.target.checked)}
/>
Supports Order
</label>

<label className="flex items-center gap-2">
<input
type="checkbox"
checked={form.supports_topup}
onChange={(e)=>setField('supports_topup',e.target.checked)}
/>
Supports Topup
</label>

</div>

<input
  type="number"
  placeholder="Sort Order"
  value={form.sort_order}
  onChange={(e)=>setField('sort_order',Number(e.target.value))}
  className="w-full border px-3 py-2 rounded"
/>

{/* Fee */}

<div className="grid grid-cols-2 gap-3">

<select
value={form.fee_type}
onChange={(e)=>setField('fee_type',e.target.value)}
className="border px-3 py-2 rounded"

>

<option value="percent">Percent</option>
<option value="fixed">Fixed</option>

</select>

<input
  type="number"
  value={form.fee_value}
  onChange={(e)=>setField('fee_value',Number(e.target.value))}
  className="border px-3 py-2 rounded"
/>

</div>

<h4 className="font-semibold mt-4">
Config
</h4>

<div className="space-y-2">

{Object.entries(form.config || {}).map(([key,val])=>(
<div key={key} className="flex gap-2">

<input
value={key}
readOnly
className="border px-2 py-1 rounded w-40 bg-gray-100"
/>

<input
value={val}
onChange={(e)=>setConfigField(key,e.target.value)}
className="border px-2 py-1 rounded flex-1"
/>

<button
onClick={()=>removeConfigField(key)}
className="text-red-500"
>
✕
</button>

</div>
))}

<button
onClick={addConfigField}
className="text-sm text-blue-500"
>
+ Add Config
</button>

</div>

{/* Secret Config */}

<h4 className="font-semibold mt-4">
Secret Config
</h4>

<div className="space-y-2">

{Object.entries(form.secret_config || {}).map(([key,val])=>(
<div key={key} className="flex gap-2">

<input
value={key}
readOnly
className="border px-2 py-1 rounded w-40 bg-gray-100"
/>

<input
value={val}
onChange={(e)=>setSecretField(key,e.target.value)}
className="border px-2 py-1 rounded flex-1"
/>

<button
onClick={()=>removeSecretField(key)}
className="text-red-500"
>
✕
</button>

</div>
))}

<button
onClick={addSecretField}
className="text-sm text-blue-500"
>
+ Add Secret
</button>

</div>

{/* Buttons */}

<div className="flex gap-3 pt-4">

<button
onClick={saveGateway}
disabled={savingGateway}
className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"

>

{savingGateway ? 'Saving...' : 'Save'} </button>

<button
onClick={()=>setShowModal(false)}
className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"

>

Cancel </button>

</div>

</div>

</div>

</div>

)}

{/* =========================================================
TOAST
========================================================= */}

{toast && (

<div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
{toast}
</div>

)}

</div>

)

}
