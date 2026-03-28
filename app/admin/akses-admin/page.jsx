"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShieldEllipsis,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";
import { usePermission } from "../../hooks/usePermission";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

function buildUrl(path) {
  if (API.endsWith("/api/v1")) {
    return `${API}${path}`;
  }
  return `${API}/api/v1${path}`;
}

async function fetchJson(path, options = {}) {
  const token = Cookies.get("token");

  const res = await fetch(buildUrl(path), {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
     revalidate: 10,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json?.success === false) {
    throw new Error(
      json?.error?.message ||
        json?.message ||
        `Request gagal (${res.status})`
    );
  }

  return json;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatGroupLabel(group = "") {
  if (!group) return "Lainnya";

  const map = {
    dashboard: "Dashboard",
    security: "Security",
    users: "Users",
    catalog: "Catalog",
    orders: "Orders",
    finance: "Finance",
    marketing: "Marketing",
    content: "Content",
    settings: "Settings",
  };

  return map[group] || group.charAt(0).toUpperCase() + group.slice(1);
}

export default function AksesAdminPage() {
  const { loading: authLoading, hasAdminFlag, admin } = usePermission();

  const canManageRbac =
    typeof hasAdminFlag === "function"
      ? hasAdminFlag("can_manage_rbac")
      : Boolean(admin?.is_super_admin);

  const [admins, setAdmins] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [draftRoleId, setDraftRoleId] = useState("");

  const loadAdmins = useCallback(async () => {
    const json = await fetchJson("/admin/admin-users");
    setAdmins(json?.data?.data || []);
  }, []);

  const loadPermissions = useCallback(async () => {
    const json = await fetchJson("/admin/permissions");
    setPermissions(Array.isArray(json?.data) ? json.data : []);
  }, []);

  const loadRoles = useCallback(async () => {
    const json = await fetchJson("/admin/admin-roles");
    setRoles(Array.isArray(json?.data) ? json.data : []);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      await Promise.all([loadAdmins(), loadPermissions(), loadRoles()]);
    } catch (err) {
      toast.error(err.message || "Gagal memuat data akses admin");
    }
  }, [loadAdmins, loadPermissions, loadRoles]);

  useEffect(() => {
    if (authLoading) return;
    if (!canManageRbac) {
      setLoading(false);
      return;
    }

    let active = true;

    const boot = async () => {
      try {
        setLoading(true);
        await loadAll();
      } finally {
        if (active) setLoading(false);
      }
    };

    boot();

    return () => {
      active = false;
    };
  }, [authLoading, canManageRbac, loadAll]);

  useEffect(() => {
    setDraftRoleId(selected?.admin_role?.id ? String(selected.admin_role.id) : "");
  }, [selected]);

  const openAdmin = useCallback(async (id) => {
    try {
      setDetailLoading(true);
      const json = await fetchJson(`/admin/admin-users/${id}`);
      setSelected(json?.data || null);
    } catch (err) {
      toast.error(err.message || "Gagal membuka detail admin");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadAll();

      if (selected?.id) {
        const json = await fetchJson(`/admin/admin-users/${selected.id}`);
        setSelected(json?.data || null);
      }

      toast.success("Data berhasil diperbarui");
    } catch (err) {
      toast.error(err.message || "Gagal refresh data");
    } finally {
      setRefreshing(false);
    }
  }, [loadAll, selected?.id]);

  const applyRole = useCallback(async () => {
    if (!selected?.id || !draftRoleId) return;

    try {
      setSavingRole(true);

      const res = await fetchJson(`/admin/admin-users/${selected.id}/apply-role`, {
        method: "POST",
        body: JSON.stringify({
          admin_role_id: Number(draftRoleId),
        }),
      });

      if (!res?.success) {
        throw new Error(res?.message || "Gagal mengubah role");
      }

      await Promise.all([openAdmin(selected.id), loadAdmins()]);
      toast.success("Role preset berhasil diterapkan");
    } catch (err) {
      toast.error(err.message || "Gagal mengubah role");
    } finally {
      setSavingRole(false);
    }
  }, [draftRoleId, loadAdmins, openAdmin, selected?.id]);

  const togglePermission = useCallback((key) => {
    setSelected((prev) => {
      if (!prev) return prev;

      const current = Array.isArray(prev.permission_keys) ? prev.permission_keys : [];
      const exists = current.includes(key);

      const nextKeys = exists
        ? current.filter((item) => item !== key)
        : [...current, key];

      return {
        ...prev,
        permission_keys: Array.from(new Set(nextKeys)),
      };
    });
  }, []);

  const savePermissions = useCallback(async () => {
    if (!selected?.id) return;

    const keys = Array.from(
      new Set(Array.isArray(selected.permission_keys) ? selected.permission_keys : [])
    );

    try {
      setSavingPermissions(true);

      const res = await fetchJson(`/admin/admin-users/${selected.id}/permissions`, {
        method: "POST",
        body: JSON.stringify({
          permission_keys: keys,
        }),
      });

      if (!res?.success) {
        throw new Error(res?.message || "Gagal menyimpan permission");
      }

      await Promise.all([openAdmin(selected.id), loadAdmins()]);
      toast.success("Custom permission berhasil disimpan");
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan permission");
    } finally {
      setSavingPermissions(false);
    }
  }, [loadAdmins, openAdmin, selected]);

  const filteredAdmins = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return admins;

    return admins.filter((item) => {
      const fullName = (item.full_name || item.name || "").toLowerCase();
      const email = (item.email || "").toLowerCase();
      const roleName = (item.admin_role?.name || "").toLowerCase();

      return (
        fullName.includes(keyword) ||
        email.includes(keyword) ||
        roleName.includes(keyword)
      );
    });
  }, [admins, search]);

  const editablePermissions = useMemo(() => {
    return permissions.filter((perm) => !perm.is_protected);
  }, [permissions]);

  const protectedPermissions = useMemo(() => {
    return permissions.filter((perm) => perm.is_protected);
  }, [permissions]);

  const groupedPermissions = useMemo(() => {
    return editablePermissions.reduce((acc, perm) => {
      const key = perm.group || "others";
      if (!acc[key]) acc[key] = [];
      acc[key].push(perm);
      return acc;
    }, {});
  }, [editablePermissions]);

  const assignableRoles = useMemo(() => {
    return roles.filter((role) => !role.is_super);
  }, [roles]);

  const selectedPermissionKeys = Array.isArray(selected?.permission_keys)
    ? selected.permission_keys
    : [];

  const selectedIsSuper = Boolean(
    selected?.is_super_admin || selected?.admin_role?.is_super
  );

  const statCards = [
    {
      title: "Total Admin",
      value: admins.length,
      icon: Users,
      tone:
        "from-violet-500/20 via-fuchsia-500/10 to-transparent border-violet-400/20",
    },
    {
      title: "Preset Role",
      value: assignableRoles.length,
      icon: UserCog,
      tone:
        "from-sky-500/20 via-cyan-500/10 to-transparent border-sky-400/20",
    },
    {
      title: "Editable Permission",
      value: editablePermissions.length,
      icon: ShieldCheck,
      tone:
        "from-emerald-500/20 via-green-500/10 to-transparent border-emerald-400/20",
    },
    {
      title: "Protected Area",
      value: protectedPermissions.length,
      icon: Lock,
      tone:
        "from-amber-500/20 via-orange-500/10 to-transparent border-amber-400/20",
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(88,28,135,0.18),rgba(17,24,39,0.9))] p-6 sm:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-3 text-white">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm sm:text-base">Memuat manajemen akses admin...</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-28 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="h-[420px] animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
          <div className="h-[420px] animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  if (!canManageRbac) {
    return (
      <div className="rounded-[28px] border border-rose-500/20 bg-[linear-gradient(135deg,rgba(127,29,29,0.22),rgba(17,24,39,0.92))] p-6 sm:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/10">
            <ShieldEllipsis className="h-7 w-7 text-rose-300" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-white">
              Akses ditolak
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-rose-100/80">
              Halaman manajemen akses admin hanya tersedia untuk owner / super
              admin. Di backend, route area RBAC memang dikunci khusus dengan
              proteksi super-admin-only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.24),transparent_30%),linear-gradient(135deg,rgba(17,24,39,0.96),rgba(24,24,27,0.95))] p-6 sm:p-8 shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-200">
              <Sparkles className="h-3.5 w-3.5" />
              Super Admin Control Center
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Manajemen Akses Admin
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-gray-300 sm:text-base">
                Kelola preset role dan custom permission untuk setiap admin
                secara elegan, aman, dan tetap sinkron dengan proteksi backend.
                Area ini khusus owner / super admin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh Data
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={`rounded-[26px] border bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl ${card.tone}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-300">{card.title}</div>
                  <div className="mt-2 text-3xl font-semibold text-white">
                    {card.value}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* LEFT PANEL */}
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 sm:p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Daftar Admin</h2>
              <p className="mt-1 text-sm text-gray-400">
                Pilih admin untuk mengelola role preset dan custom permission.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
              {filteredAdmins.length} admin
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, atau role..."
              className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-fuchsia-400/40 focus:bg-black/30"
            />
          </div>

          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            {filteredAdmins.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center text-sm text-gray-400">
                Tidak ada admin yang cocok dengan pencarian.
              </div>
            ) : (
              filteredAdmins.map((item) => {
                const active = selected?.id === item.id;
                const fullName = item.full_name || item.name || "Tanpa Nama";
                const roleName = item.admin_role?.name || "Tanpa Role";

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openAdmin(item.id)}
                    className={`group w-full rounded-3xl border p-4 text-left transition ${
                      active
                        ? "border-fuchsia-400/30 bg-fuchsia-500/10 shadow-[0_10px_30px_rgba(168,85,247,0.18)]"
                        : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-sm font-semibold text-white">
                        {getInitials(fullName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-white">
                          {fullName}
                        </div>
                        <div className="truncate text-xs text-gray-400">
                          {item.email}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300">
                            {roleName}
                          </span>
                          {item.admin_role?.is_super ? (
                            <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-200">
                              Super Admin
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 sm:p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          {!selected ? (
            <div className="flex min-h-[540px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-fuchsia-400/20 bg-fuchsia-500/10">
                <ShieldCheck className="h-7 w-7 text-fuchsia-200" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                Pilih admin terlebih dahulu
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-gray-400">
                Setelah memilih admin dari panel kiri, kamu bisa menerapkan role
                preset dan menyesuaikan custom permission secara detail.
              </p>
            </div>
          ) : detailLoading ? (
            <div className="flex min-h-[540px] items-center justify-center">
              <div className="flex items-center gap-3 text-gray-300">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Memuat detail admin...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.14),rgba(17,24,39,0.78))] p-5 sm:p-6">
                <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-fuchsia-500/10 blur-3xl" />

                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-black/20 text-lg font-semibold text-white">
                      {getInitials(selected.full_name || selected.name || "")}
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-2xl font-semibold text-white">
                        {selected.full_name || selected.name || "Tanpa Nama"}
                      </h2>
                      <p className="mt-1 truncate text-sm text-gray-300">
                        {selected.email}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
                          {selected.admin_role?.name || "Tanpa Role"}
                        </span>

                        {selectedIsSuper ? (
                          <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                            Super Admin Account
                          </span>
                        ) : (
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                            Editable Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs leading-5 text-gray-300">
                    RBAC & Audit Logs tetap area protected.
                    <br />
                    Custom checklist hanya untuk permission non-protected.
                  </div>
                </div>
              </div>

              {selectedIsSuper ? (
                <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-200" />
                    <div>
                      <div className="font-medium text-amber-100">
                        Akun super admin tidak disarankan diedit dari panel ini
                      </div>
                      <p className="mt-1 text-sm leading-6 text-amber-100/80">
                        Untuk menjaga keamanan, preset role dan custom
                        permission untuk akun super admin sebaiknya tidak diubah
                        dari panel operasional ini.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[380px_minmax(0,1fr)]">
                {/* ROLE PRESET */}
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Role Preset
                      </h3>
                      <p className="mt-1 text-sm text-gray-400">
                        Terapkan paket akses cepat sesuai fungsi admin.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
                      <UserCog className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <select
                      value={draftRoleId}
                      onChange={(e) => setDraftRoleId(e.target.value)}
                      disabled={selectedIsSuper || savingRole}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="" disabled>
                        Pilih role preset
                      </option>

                      {assignableRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={applyRole}
                      disabled={
                        selectedIsSuper ||
                        savingRole ||
                        !draftRoleId ||
                        String(selected?.admin_role?.id || "") === String(draftRoleId)
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#7c3aed,#a855f7)] px-4 py-3 text-sm font-medium text-white shadow-[0_12px_30px_rgba(124,58,237,0.35)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {savingRole ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Terapkan Role Preset
                    </button>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-gray-400">
                      Tips:
                      <br />
                      Gunakan role preset untuk baseline akses, lalu gunakan
                      custom permission di kanan untuk penyesuaian detail.
                    </div>
                  </div>
                </div>

                {/* CUSTOM PERMISSIONS */}
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Custom Permission
                      </h3>
                      <p className="mt-1 text-sm text-gray-400">
                        Checklist hanya menampilkan permission non-protected.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {protectedPermissions.map((perm) => (
                        <span
                          key={perm.key}
                          className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-200"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          {perm.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    {Object.entries(groupedPermissions).map(([group, items]) => (
                      <div
                        key={group}
                        className="rounded-[22px] border border-white/10 bg-black/15 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-white">
                            {formatGroupLabel(group)}
                          </div>
                          <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300">
                            {items.length} permission
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {items.map((perm) => {
                            const checked = selectedPermissionKeys.includes(perm.key);

                            return (
                              <label
                                key={perm.key}
                                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition ${
                                  checked
                                    ? "border-fuchsia-400/30 bg-fuchsia-500/10"
                                    : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
                                } ${
                                  selectedIsSuper ? "pointer-events-none opacity-60" : ""
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={selectedIsSuper}
                                  onChange={() => togglePermission(perm.key)}
                                  className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-fuchsia-500 focus:ring-fuchsia-400"
                                />

                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-white">
                                    {perm.label}
                                  </span>
                                  <span className="mt-1 block break-all text-[11px] text-gray-500">
                                    {perm.key}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-6 text-gray-400">
                      Permission protected seperti akses RBAC dan audit logs
                      sengaja tidak bisa diedit dari checklist ini.
                    </p>

                    <button
                      type="button"
                      onClick={savePermissions}
                      disabled={selectedIsSuper || savingPermissions}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2563eb,#7c3aed)] px-4 py-3 text-sm font-medium text-white shadow-[0_12px_30px_rgba(59,130,246,0.28)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {savingPermissions ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      Simpan Custom Permission
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}