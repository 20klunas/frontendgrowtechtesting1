'use client'

import { useEffect, useState } from 'react'
import SectionCard from '../../../components/admin/SectionCard'
import Cookies from 'js-cookie'

const API = process.env.NEXT_PUBLIC_API_URL

export default function PaymentPage() {

  const token = Cookies.get('token')

  const [loading,setLoading] = useState(true)

  const [percent,setPercent] = useState(null)
  const [editPercent,setEditPercent] = useState('')
  const [isPublic,setIsPublic] = useState(true)

  const [saving,setSaving] = useState(false)

  const [toast,setToast] = useState(null)
  const [error,setError] = useState(null)

  // gateway states
  const [gateways,setGateways] = useState([])
  const [gatewayLoading,setGatewayLoading] = useState(true)

  const [showModal,setShowModal] = useState(false)
  const [editingGateway,setEditingGateway] = useState(null)

  const [form,setForm] = useState({
    name:'',
    provider:'',
    driver:'',
    description:'',
    is_active:true,
    supports_order:true,
    supports_topup:true,
    sandbox_mode:true,
    fee_type:'percent',
    fee_value:0,
    sort_order:0,
    secret_config:{
      server_key:'',
      client_key:'',
      merchant_id:''
    }
  })

  // =========================
  // FETCH SETTINGS
  // =========================

  useEffect(()=>{
    fetchSetting()
    fetchGateways()
  },[])

  const fetchSetting = async () => {

    try{

      const res = await fetch(`${API}/api/v1/admin/settings`,{
        headers:{
          Authorization:`Bearer ${token}`,
          Accept:'application/json'
        }
      })

      const json = await res.json()

      if(json.success && Array.isArray(json.data)){

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

  // =========================
  // FETCH GATEWAYS
  // =========================

  const fetchGateways = async () => {

    try{

      const res = await fetch(`${API}/api/v1/admin/payment-gateways`,{
        headers:{
          Authorization:`Bearer ${token}`,
          Accept:'application/json'
        }
      })

      const json = await res.json()

      if(json.success){

        setGateways(json.data.data)

      }

    }catch(err){

      console.error(err)

    }finally{

      setGatewayLoading(false)

    }

  }

  // =========================
  // SAVE PERCENT
  // =========================

  const handleSavePercent = async () => {

    const numeric = parseFloat(editPercent)

    if(isNaN(numeric) || numeric < 0 || numeric > 100){

      setError('Percent harus antara 0 - 100')
      return

    }

    try{

      setSaving(true)

      const res = await fetch(`${API}/api/v1/admin/settings/upsert`,{

        method:'POST',

        headers:{
          Authorization:`Bearer ${token}`,
          'Content-Type':'application/json'
        },

        body:JSON.stringify({

          group:'payment',
          key:'fee_percent',
          value:{ percent:numeric },
          is_public:isPublic

        })

      })

      const json = await res.json()

      if(json.success){

        setPercent(numeric)

        setToast('Fee percent berhasil disimpan')

      }

    }catch(err){

      setError('Gagal menyimpan')

    }finally{

      setSaving(false)

    }

  }

  // =========================
  // FORM HANDLER
  // =========================

  const handleChange = (key,val)=>{

    setForm(prev=>({...prev,[key]:val}))

  }

  const handleSecretChange = (key,val)=>{

    setForm(prev=>({

      ...prev,
      secret_config:{
        ...prev.secret_config,
        [key]:val
      }

    }))

  }

  // =========================
  // CREATE / UPDATE GATEWAY
  // =========================

  const saveGateway = async ()=>{

    try{

      setSaving(true)

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

        setToast('Gateway berhasil disimpan')

        fetchGateways()

        setShowModal(false)

        resetForm()

      }

    }catch(err){

      console.error(err)

    }finally{

      setSaving(false)

    }

  }

  // =========================
  // DELETE
  // =========================

  const deleteGateway = async (code)=>{

    if(!confirm('Hapus gateway ini?')) return

    try{

      const res = await fetch(`${API}/api/v1/admin/payment-gateways/${code}`,{

        method:'DELETE',

        headers:{
          Authorization:`Bearer ${token}`
        }

      })

      const json = await res.json()

      if(json.success){

        setToast('Gateway berhasil dihapus')

        fetchGateways()

      }

    }catch(err){

      console.error(err)

    }

  }

  // =========================
  // EDIT
  // =========================

  const editGateway = (g)=>{

    setEditingGateway(g)

    setForm({

      name:g.name,
      provider:g.provider,
      driver:g.driver,
      description:g.description || '',
      is_active:g.is_active,
      supports_order:g.supports_order,
      supports_topup:g.supports_topup,
      sandbox_mode:g.sandbox_mode,
      fee_type:g.fee_type,
      fee_value:g.fee_value,
      sort_order:g.sort_order,

      secret_config:{
        server_key:'',
        client_key:'',
        merchant_id:''
      }

    })

    setShowModal(true)

  }

  const resetForm = ()=>{

    setEditingGateway(null)

    setForm({

      name:'',
      provider:'',
      driver:'',
      description:'',
      is_active:true,
      supports_order:true,
      supports_topup:true,
      sandbox_mode:true,
      fee_type:'percent',
      fee_value:0,
      sort_order:0,

      secret_config:{
        server_key:'',
        client_key:'',
        merchant_id:''
      }

    })

  }

  // =========================
  // UI
  // =========================

  return (

    <div className="space-y-8">

      {/* ================= GLOBAL PAYMENT FEE ================= */}

      <SectionCard title="Payment Fee Configuration">

        {loading ? (

          <p>Loading...</p>

        ):(

          <div className="space-y-6">

            <div>

              <p className="text-sm opacity-70">
                Current Fee Percent
              </p>

              <p className="text-2xl font-bold">
                {percent}%
              </p>

            </div>

            <div className="flex gap-4 flex-wrap">

              <input
                type="number"
                value={editPercent}
                onChange={(e)=>setEditPercent(e.target.value)}
                className="border rounded px-3 py-2 w-32 bg-transparent"
              />

              <button
                onClick={handleSavePercent}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>

            </div>

          </div>

        )}

      </SectionCard>

      {/* ================= PAYMENT GATEWAYS ================= */}

      <SectionCard title="Payment Gateways">

        <div className="flex justify-between mb-4">

          <h2 className="font-semibold">
            Gateway List
          </h2>

          <button
            onClick={()=>{

              resetForm()

              setShowModal(true)

            }}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Add Gateway
          </button>

        </div>

        {gatewayLoading ? (

          <p>Loading gateway...</p>

        ):(

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b">

                  <th className="text-left py-2">Name</th>
                  <th>Provider</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Actions</th>

                </tr>

              </thead>

              <tbody>

                {gateways.map(g=>(
                  <tr key={g.id} className="border-b">

                    <td className="py-2">
                      {g.name}
                    </td>

                    <td>
                      {g.provider}
                    </td>

                    <td>
                      {g.fee_value}
                      {g.fee_type === 'percent' ? '%' : ' IDR'}
                    </td>

                    <td>

                      {g.is_active
                        ? 'Active'
                        : 'Disabled'}

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

          </div>

        )}

      </SectionCard>

      {/* ================= MODAL ================= */}

      {showModal && (

        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-xl">

            <h3 className="text-lg font-semibold mb-4">
              {editingGateway ? 'Edit Gateway' : 'Create Gateway'}
            </h3>

            <div className="space-y-3">

              <input
                placeholder="Name"
                value={form.name}
                onChange={(e)=>handleChange('name',e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />

              <input
                placeholder="Provider"
                value={form.provider}
                onChange={(e)=>handleChange('provider',e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />

              <input
                placeholder="Driver"
                value={form.driver}
                onChange={(e)=>handleChange('driver',e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />

              <input
                placeholder="Fee Value"
                type="number"
                value={form.fee_value}
                onChange={(e)=>handleChange('fee_value',e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />

              <div className="flex gap-3">

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

        <div className="fixed bottom-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow">

          {toast}

        </div>

      )}

    </div>

  )

}