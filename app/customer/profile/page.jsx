"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ChangePasswordModal from "../../components/customer/ChangePasswordModal";
import { User, Mail, MapPin, Pencil } from "lucide-react";
import { useAuth } from "../../../app/hooks/useAuth";
import { apiFetch } from "../../../app/lib/utils";

export default function ProfilePage() {
  const { user, setUser, loading } = useAuth();

  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialForm, setInitialForm] = useState(null);

  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [form, setForm] = useState({
    name: "",
    full_name: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    if (loading) return;

    const fetchProfile = async () => {
      try {
        const res = await apiFetch("/api/v1/auth/me/profile", { method: "GET" });
        const data = res.data;

        const profileData = {
          name: data?.name || "",
          full_name: data?.full_name || "",
          email: data?.email || "",
          address: data?.address || "",
        };

        setForm(profileData);
        setInitialForm(profileData);

        setUser(data);
      } catch (err) {
        console.error("GET PROFILE ERROR:", err);
        alert(err?.message || "Gagal mengambil data profil");
      }
    };

    fetchProfile();
  }, [loading, setUser]);

  useEffect(() => {
    if (!avatarFile) return;

    const uploadAvatar = async () => {
      setUploadingAvatar(true);
      try {

        const signRes = await apiFetch("/api/v1/auth/me/avatar/sign", {
          method: "POST",
          body: JSON.stringify({ mime: avatarFile.type }),
        });

        const { path, signed_url, public_url } = signRes.data;

        const putRes = await fetch(signed_url, {
          method: "PUT",
          headers: { "Content-Type": avatarFile.type },
          body: avatarFile,
        });

        if (!putRes.ok) {
          const t = await putRes.text().catch(() => "");
          console.error("PUT SUPABASE FAILED:", putRes.status, t);
          throw new Error(`Upload ke Supabase gagal: HTTP ${putRes.status}`);
        }

        await apiFetch("/api/v1/auth/me/avatar", {
          method: "PATCH",
          body: JSON.stringify({
            avatar_path: path,
            avatar_url: public_url,
            avatar: public_url, 
          }),
        });

        const profileRes = await apiFetch("/api/v1/auth/me/profile", {
          method: "GET",
        });

        setUser(profileRes.data);
        alert("Avatar berhasil diperbarui");
      } catch (err) {
        console.error("UPLOAD AVATAR ERROR:", err);
        alert(err?.message || "Gagal upload avatar");
      } finally {
        setUploadingAvatar(false);
        setAvatarFile(null);
      }
    };

    uploadAvatar();
  }, [avatarFile, setUser]);

  if (loading) return null;
  if (!user) return <p className="text-white text-center">User tidak ditemukan</p>;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran maksimal 2MB");
      return;
    }

    setAvatarFile(file);
  };

  const isFilled = (value) => value && value.trim() !== "";
  const isChanged = (key) => initialForm && form[key] !== initialForm[key];

  const hasChanges =
    initialForm &&
    Object.keys(form).some((key) => form[key] !== initialForm[key]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/v1/auth/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name, 
          full_name: form.full_name,
          address: form.address,
        }),
      });

      const data = res.data;

      const updated = {
        name: data?.name || "",
        full_name: data?.full_name || "",
        email: data?.email || "",
        address: data?.address || "",
      };

      setForm(updated);
      setInitialForm(updated);
      setUser(data);

      alert("Profil berhasil diperbarui");
    } catch (err) {
      console.error("UPDATE PROFILE ERROR:", err);
      alert(err?.message || "Gagal update profil");
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = user?.avatar_url || user?.avatar || null;

  return (
    <>
      <main className="min-h-screen bg-black px-4 pt-28 pb-24">
        <div className="max-w-5xl mx-auto">
          {/* PROFILE IMAGE */}
          <div className="flex justify-center mb-10">
            <div className="relative w-56 h-56 rounded-3xl border-2 border-purple-500 overflow-hidden">
              <Image
                key={avatarSrc || "fallback"}
                src={avatarSrc ? `${avatarSrc}?t=${Date.now()}` : "/logoherosection.png"}
                alt="Profile"
                fill
                className="rounded-2xl object-cover"
                sizes="224px"
                priority
              />

              <input
                type="file"
                accept="image/*"
                hidden
                id="avatarInput"
                onChange={handleAvatarSelect}
              />

              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => document.getElementById("avatarInput")?.click()}
                className="absolute bottom-3 right-3 bg-purple-700 p-2 rounded-lg disabled:opacity-50"
              >
                {uploadingAvatar ? "..." : <Pencil size={16} className="text-white" />}
              </button>
            </div>
          </div>

          {/* PROFILE FORM */}
          <div className="border border-purple-500/50 rounded-3xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Profil Akun</h2>

            <div className="space-y-5">
              <Input
                icon={<User />}
                label="Nama Pengguna"
                name="name"
                value={form.name}
                onChange={handleChange}
                filled={isFilled(form.name)}
                changed={isChanged("name")}
              />

              <Input
                icon={<User />}
                label="Nama Lengkap"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                filled={isFilled(form.full_name)}
                changed={isChanged("full_name")}
              />

              <Input icon={<Mail />} label="Email" name="email" value={form.email} disabled filled />

              <Input
                icon={<MapPin />}
                label="Alamat"
                name="address"
                value={form.address}
                onChange={handleChange}
                filled={isFilled(form.address)}
                changed={isChanged("address")}
              />
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={() => setOpenModal(true)}
                className="border border-purple-500 px-6 py-2 rounded-xl text-white hover:bg-purple-500/10"
              >
                Ganti Password!
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="bg-purple-700 px-6 py-2 rounded-xl text-white font-semibold hover:bg-purple-800 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <ChangePasswordModal open={openModal} onClose={() => setOpenModal(false)} />
    </>
  );
}

function Input({
  icon,
  label,
  name,
  value,
  onChange,
  disabled = false,
  filled = false,
  changed = false,
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-purple-300 mb-1">
        {icon} {label}
        {changed && <span className="text-xs text-purple-400">(diubah)</span>}
      </label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={disabled ? "" : "Belum diisi"}
        className={`w-full rounded-xl px-4 py-2 outline-none text-white border
          ${filled ? "bg-purple-900/60 border-purple-500" : "bg-black border-purple-700/30 text-gray-400"}
          ${changed ? "ring-2 ring-purple-500/40" : ""}
          disabled:opacity-60`}
      />
    </div>
  );
}