'use client'

import { useState, useEffect } from "react"
import SectionCard from "../../../components/admin/SectionCard"
import { apiFetch } from "../../../../app/lib/apiFetch"
import Toast from "../../../components/ui/Toast"
import PermissionGate from "../../../components/admin/PermissionGate"

export default function WebsitePage() {

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [initialForm, setInitialForm] = useState(null)

  const [form, setForm] = useState({
    site_name: "",
    short_name: "",
    home_title: "",
    home_subtitle: "",
    description: "",
    keywords: "",
    phone: "",
    email: "",
    footer_desc: "",
    version: "",

    maintenance_web: false,
    maintenance_api: false,

    system: {
      public_access: { enabled: true, message: "" },
      user_auth_access: { enabled: true, message: "" },
      user_area_access: { enabled: true, message: "" },
      catalog_access: { enabled: true, message: "" },
      checkout_access: { enabled: true, message: "" },
      topup_access: { enabled: true, message: "" },
    }
  })

  /* ================= GET ================= */

  useEffect(() => {

    const fetchSettings = async () => {

      try {

        const websiteRes = await apiFetch("/api/v1/admin/settings?group=website")
        const systemRes = await apiFetch("/api/v1/admin/settings?group=system")

        const websiteMap = {}
        websiteRes.data.forEach(item => {
          websiteMap[item.key] = item.value
        })

        const systemMap = {}
        systemRes.data.forEach(item => {
          systemMap[item.key] = item.value
        })

        const brand = websiteMap.brand || {}
        const footer = websiteMap.footer || {}
        const seo = websiteMap.seo || {}

        const mapped = {
          site_name: brand.site_name || "",
          short_name: brand.short_name || "",
          home_title: brand.home_title || "",
          home_subtitle: brand.home_subtitle || "",
          description: brand.description || "",
          phone: brand.phone || "",
          email: brand.email || "",
          version: brand.version || "",
          maintenance_web: !!brand.maintenance_web,
          maintenance_api: !!brand.maintenance_api,
          footer_desc: footer.footer_desc || "",
          keywords: Array.isArray(seo.keywords) ? seo.keywords.join(", ") : "",

          system: {
            public_access: systemMap.public_access || { enabled: true, message: "" },
            user_auth_access: systemMap.user_auth_access || { enabled: true, message: "" },
            user_area_access: systemMap.user_area_access || { enabled: true, message: "" },
            catalog_access: systemMap.catalog_access || { enabled: true, message: "" },
            checkout_access: systemMap.checkout_access || { enabled: true, message: "" },
            topup_access: systemMap.topup_access || { enabled: true, message: "" },
          }
        }

        setForm(mapped)
        setInitialForm(mapped)

      } catch (err) {

        console.error(err)
        setToast({
          type: "error",
          message: "Gagal memuat konfigurasi website",
        })

      } finally {

        setLoading(false)

      }

    }

    fetchSettings()

  }, [])

  /* ================= CHANGE ================= */

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target

    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

  }

  const handleSystemToggle = (key, field, value) => {

    setForm(prev => ({
      ...prev,
      system: {
        ...prev.system,
        [key]: {
          ...prev.system[key],
          [field]: value
        }
      }
    }))

  }

  const isChanged = (key) =>
    initialForm && form[key] !== initialForm[key]

  const hasChanges =
    initialForm &&
    JSON.stringify(form) !== JSON.stringify(initialForm)

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {

    setSaving(true)

    try {

      await apiFetch("/api/v1/admin/settings/upsert", {
        method: "POST",
        body: JSON.stringify({
          group: "website",
          key: "brand",
          value: {
            site_name: form.site_name,
            short_name: form.short_name,
            home_title: form.home_title,
            home_subtitle: form.home_subtitle,
            description: form.description,
            phone: form.phone,
            email: form.email,
            version: form.version,
            maintenance_web: form.maintenance_web,
            maintenance_api: form.maintenance_api,
          },
          is_public: true,
        }),
      })

      await apiFetch("/api/v1/admin/settings/upsert", {
        method: "POST",
        body: JSON.stringify({
          group: "website",
          key: "footer",
          value: { footer_desc: form.footer_desc },
          is_public: true,
        }),
      })

      await apiFetch("/api/v1/admin/settings/upsert", {
        method: "POST",
        body: JSON.stringify({
          group: "website",
          key: "seo",
          value: {
            keywords: form.keywords
              .split(",")
              .map(k => k.trim())
              .filter(Boolean),
          },
          is_public: true,
        }),
      })

      for (const key in form.system) {

        await apiFetch("/api/v1/admin/settings/upsert", {
          method: "POST",
          body: JSON.stringify({
            group: "system",
            key: key,
            value: form.system[key],
            is_public: false
          }),
        })

      }

      setInitialForm(form)

      setToast({
        type: "success",
        message: "Pengaturan website disimpan",
      })

    } catch {

      setToast({
        type: "error",
        message: "Gagal menyimpan pengaturan",
      })

    } finally {

      setSaving(false)

    }

  }

  if (loading) return null

  return (

    <PermissionGate permission="manage_site_settings">

      <>

        {toast && (
          <Toast {...toast} onClose={() => setToast(null)} />
        )}

        {Object.values(form.system).some(v => !v.enabled) && (
          <div className="mb-4 p-4 bg-yellow-600/20 border border-yellow-500 rounded-lg">
            ⚠ Beberapa fitur website sedang dalam mode maintenance
          </div>
        )}

        {/* ================= WEBSITE SETTINGS ================= */}

        <SectionCard title="Pengaturan Utama Website">

          <div className="grid grid-cols-2 gap-4">

            <Input label="Judul Website" name="site_name" value={form.site_name} onChange={handleChange} changed={isChanged("site_name")} />
            <Input label="Judul Pendek" name="short_name" value={form.short_name} onChange={handleChange} changed={isChanged("short_name")} />

            <Input label="Title Home" name="home_title" value={form.home_title} onChange={handleChange} changed={isChanged("home_title")} />
            <Input label="Subtitle Home" name="home_subtitle" value={form.home_subtitle} onChange={handleChange} changed={isChanged("home_subtitle")} />

            <Textarea label="Deskripsi Website" name="description" value={form.description} onChange={handleChange} changed={isChanged("description")} />
            <Textarea label="Web Keyword (SEO)" name="keywords" value={form.keywords} onChange={handleChange} changed={isChanged("keywords")} />

            <Input label="Phone / Discord" name="phone" value={form.phone} onChange={handleChange} changed={isChanged("phone")} />
            <Input label="Email" name="email" value={form.email} onChange={handleChange} changed={isChanged("email")} />

            <Textarea label="Footer Deskripsi" name="footer_desc" value={form.footer_desc} onChange={handleChange} changed={isChanged("footer_desc")} />
            <Input label="Versi Website" name="version" value={form.version} onChange={handleChange} changed={isChanged("version")} />

          </div>

        </SectionCard>

        {/* ================= MAINTENANCE CONTROL ================= */}

        <SectionCard title="System Maintenance Control">

          <div className="space-y-6">

            {Object.entries(form.system).map(([key, value]) => (

              <div key={key} className="border border-gray-700 p-4 rounded-lg">

                <div className="flex items-center justify-between mb-3">

                  <div className="font-semibold">
                    {key.replaceAll("_", " ")}
                  </div>

                  <input
                    type="checkbox"
                    checked={!value.enabled}
                    onChange={(e) =>
                      handleSystemToggle(
                        key,
                        "enabled",
                        !e.target.checked
                      )
                    }
                  />

                </div>

                {!value.enabled && (

                  <input
                    value={value.message}
                    placeholder="Pesan maintenance..."
                    onChange={(e) =>
                      handleSystemToggle(
                        key,
                        "message",
                        e.target.value
                      )
                    }
                    className="input w-full"
                  />

                )}

              </div>

            ))}

          </div>

        </SectionCard>

        <div className="pt-6">

          <button
            onClick={handleSubmit}
            disabled={!hasChanges || saving}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>

        </div>

      </>

    </PermissionGate>

  )

}

/* ================= INPUT ================= */

function Input({ label, changed, ...props }) {
  return (
    <div>
      <label className="text-sm text-gray-400">
        {label}
        {changed && <span className="ml-2 text-purple-400">(diubah)</span>}
      </label>
      <input {...props} className={`input mt-1 w-full ${changed ? "ring-2 ring-purple-500/40" : ""}`} />
    </div>
  )
}

function Textarea({ label, changed, ...props }) {
  return (
    <div className="col-span-2">
      <label className="text-sm text-gray-400">
        {label}
        {changed && <span className="ml-2 text-purple-400">(diubah)</span>}
      </label>
      <textarea {...props} className={`input mt-1 w-full min-h-[90px] ${changed ? "ring-2 ring-purple-500/40" : ""}`} />
    </div>
  )
}