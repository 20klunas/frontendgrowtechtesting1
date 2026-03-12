"use client"

import { useEffect, useState } from "react"
import Cookies from "js-cookie"
import PermissionGate from "../../components/admin/PermissionGate"
import toast from "react-hot-toast"

const API = process.env.NEXT_PUBLIC_API_URL

export default function AksesAdminPage() {

  const [admins,setAdmins] = useState([])
  const [permissions,setPermissions] = useState([])
  const [roles,setRoles] = useState([])
  const [selected,setSelected] = useState(null)

  const [loading,setLoading] = useState(true)

  const token = Cookies.get("token")

  const headers = {
    Authorization:`Bearer ${token}`,
    Accept:"application/json",
    "Content-Type":"application/json"
  }

  // =============================
  // LOAD DATA
  // =============================

  const loadAdmins = async () => {
    const res = await fetch(`${API}/api/v1/admin/admin-users`,{headers})
    const json = await res.json()
    setAdmins(json.data.data || [])
  }

  const loadPermissions = async () => {
    const res = await fetch(`${API}/api/v1/admin/permissions`,{headers})
    const json = await res.json()
    setPermissions(json.data || [])
  }

  const loadRoles = async () => {
    const res = await fetch(`${API}/api/v1/admin/admin-roles`,{headers})
    const json = await res.json()
    setRoles(json.data || [])
  }

  useEffect(()=>{
    Promise.all([
      loadAdmins(),
      loadPermissions(),
      loadRoles()
    ]).finally(()=>setLoading(false))
  },[])

  // =============================
  // SELECT ADMIN
  // =============================

  const openAdmin = async (id) => {

    const res = await fetch(`${API}/api/v1/admin/admin-users/${id}`,{headers})
    const json = await res.json()

    setSelected(json.data)
  }

  // =============================
  // APPLY ROLE
  // =============================

  const applyRole = async (roleId) => {

    if(!selected) return

    try {

      const res = await fetch(`${API}/api/v1/admin/admin-users/${selected.id}/apply-role`,{
        method:"POST",
        headers,
        body:JSON.stringify({admin_role_id:roleId})
      })

      const json = await res.json()

      if(!json.success){
        throw new Error(json.message || "Gagal mengubah role")
      }

      toast.success("Role berhasil diterapkan")

      openAdmin(selected.id)
      loadAdmins()

    } catch(err){

      toast.error(err.message)

    }

  }

  // =============================
  // SAVE PERMISSION
  // =============================

  const savePermissions = async (keys) => {

    if(!selected) return

    try {

      const res = await fetch(`${API}/api/v1/admin/admin-users/${selected.id}/permissions`,{
        method:"POST",
        headers,
        body:JSON.stringify({permission_keys:keys})
      })

      const json = await res.json()

      if(!json.success){
        throw new Error(json.message || "Gagal menyimpan permission")
      }

      toast.success("Permission berhasil disimpan")

      openAdmin(selected.id)
      loadAdmins()

    } catch(err) {

      toast.error(err.message)

    }

  }

  // =============================
  // UI
  // =============================

  return (
  <PermissionGate permission="manage_admins">

  <div className="space-y-6">

    <h1 className="text-3xl font-bold text-white">
      Manajemen Akses Admin
    </h1>

    {loading ? (
      <p className="text-purple-400">Loading...</p>
    ) : (

    <div className="grid grid-cols-3 gap-6">

      {/* ================= ADMIN LIST ================= */}

      <div className="col-span-1 border border-purple-700 rounded-xl p-4">

        <h2 className="font-semibold mb-4 text-white">
          Daftar Admin
        </h2>

        {admins.map(a=>(
          <div
            key={a.id}
            onClick={()=>openAdmin(a.id)}
            className="
            cursor-pointer
            p-3
            mb-2
            rounded
            bg-purple-900/20
            hover:bg-purple-900/40
            "
          >
            <div className="text-white font-medium">
              {a.full_name}
            </div>

            <div className="text-xs text-gray-400">
              {a.admin_role?.name}
            </div>
          </div>
        ))}

      </div>

      {/* ================= DETAIL ================= */}

      <div className="col-span-2 border border-purple-700 rounded-xl p-6">

        {!selected ? (
          <p className="text-gray-400">
            Pilih admin untuk melihat detail
          </p>
        ) : (

        <div className="space-y-6">

          <div>
            <h2 className="text-xl font-semibold text-white">
              {selected.full_name}
            </h2>

            <p className="text-gray-400 text-sm">
              {selected.email}
            </p>
          </div>

          {/* ================= ROLE ================= */}

          <div>

            <h3 className="text-white mb-2">
              Role Preset
            </h3>

            <select
              className="input-primary"
              onChange={(e)=>applyRole(e.target.value)}
              defaultValue={selected.admin_role?.id}
            >
              {roles.map(r=>(
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

          </div>

          {/* ================= PERMISSION ================= */}

          <div>

            <h3 className="text-white mb-3">
              Custom Permission
            </h3>

            <div className="grid grid-cols-2 gap-2">

              {permissions.map(p=>{

                const checked = selected.permission_keys?.includes(p.key)

                return (
                  <label
                    key={p.key}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >

                    <input
                      type="checkbox"
                      defaultChecked={checked}
                      onChange={(e)=>{

                        let keys = [...(selected.permission_keys||[])]

                        if(e.target.checked){
                          keys.push(p.key)
                        }else{
                          keys = keys.filter(k=>k!==p.key)
                        }

                        setSelected({
                          ...selected,
                          permission_keys:keys
                        })
                      }}
                    />

                    {p.label}

                  </label>
                )

              })}

            </div>

            <button
              className="btn-add mt-4"
              onClick={()=>savePermissions(selected.permission_keys)}
            >
              Simpan Permission
            </button>

          </div>

        </div>

        )}

      </div>

    </div>

    )}

  </div>

  </PermissionGate>
  )
}