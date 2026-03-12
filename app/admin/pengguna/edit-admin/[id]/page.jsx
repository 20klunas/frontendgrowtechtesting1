'use client'

import { useRouter, useParams } from "next/navigation"
import { PERMISSIONS } from "../../../../lib/permissions"

export default function EditAdminPage() {

  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const permissionList = Object.values(PERMISSIONS)

  return (
    <div className="admin px-6 py-10 max-w-6xl">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold modal-title">
          Edit Admin
        </h1>

        <p className="modal-text text-sm mt-1">
          Perbarui informasi akun admin dan hak aksesnya
        </p>
      </div>

      {/* CARD */}
      <div className="
        modal-card
        rounded-2xl
        border
        p-8
        shadow-[0_0_30px_rgba(168,85,247,0.15)]
      ">

        {/* ======================
            INFORMASI ADMIN
        ====================== */}

        <h3 className="font-semibold text-lg mb-4 modal-title">
          Informasi Admin
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

          <div>
            <label className="modal-text text-sm block mb-1">
              Email
            </label>

            <input
              className="input-primary"
              defaultValue="growtech@central.id"
            />
          </div>

          <div>
            <label className="modal-text text-sm block mb-1">
              Nama Lengkap
            </label>

            <input
              className="input-primary"
              defaultValue="Ono Suno"
            />
          </div>

          <div>
            <label className="modal-text text-sm block mb-1">
              Username
            </label>

            <input
              className="input-primary"
              defaultValue="ono"
            />
          </div>

          <div>
            <label className="modal-text text-sm block mb-1">
              Role
            </label>

            <select className="input-primary">
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>

        </div>

        {/* ======================
            PERMISSIONS
        ====================== */}

        <h3 className="font-semibold text-lg mb-4 modal-title">
          Hak Akses Sistem
        </h3>

        <p className="modal-text text-sm mb-4">
          Pilih hak akses yang dapat digunakan oleh admin ini
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">

          {permissionList.map((p) => (

            <label
              key={p}
              className="
                flex
                items-center
                gap-3
                border
                border-purple-700/40
                rounded-lg
                px-4
                py-3
                cursor-pointer
                hover:bg-purple-700/10
                transition
              "
            >

              <input
                type="checkbox"
                defaultChecked
                className="accent-purple-600"
              />

              <span className="modal-text text-sm">
                {p}
              </span>

            </label>

          ))}

        </div>

        {/* ======================
            ACTION BUTTON
        ====================== */}

        <div className="flex justify-end gap-3">

          <button
            onClick={() => router.back()}
            className="
              px-6
              py-2
              rounded-lg
              border
              border-gray-500
              modal-text
              hover:bg-gray-700/20
            "
          >
            Batal
          </button>

          <button
            className="
              px-6
              py-2
              rounded-lg
              bg-purple-700
              hover:bg-purple-600
              text-white
              font-semibold
            "
          >
            Update Admin
          </button>

        </div>

      </div>

    </div>
  )
}