'use client'

import { useEffect, useState, useMemo } from "react"
import {
  Check,
  X,
  Loader2,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle
} from "lucide-react"

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from "recharts"

import { authFetch } from "../../../lib/authFetch"
import ReferralTabs from "../components/ReferralTabs"
import TableWrapper from "../components/TableWrapper"

/* ================= PAGE ================= */

export default function ApprovalWDPage() {

  const [withdraws,setWithdraws]=useState([])
  const [loading,setLoading]=useState(true)
  const [statusFilter,setStatusFilter]=useState("pending")
  const [actionLoading,setActionLoading]=useState(null)

  /* ================= FETCH ================= */

  useEffect(()=>{ fetchWithdraws() },[statusFilter])

  async function fetchWithdraws(){

    try{

      setLoading(true)

      const json = await authFetch(`/api/v1/admin/withdraws?status=${statusFilter}`)

      setWithdraws(json.data?.data || [])

    }catch(err){

      console.error(err)

    }finally{

      setLoading(false)

    }

  }

  /* ================= ACTIONS ================= */

  async function approveWithdraw(id){

    try{

      setActionLoading(id)

      await authFetch(`/api/v1/admin/withdraws/${id}/approve`,{
        method:"POST"
      })

      fetchWithdraws()

    }catch(err){

      alert(err.message)

    }finally{

      setActionLoading(null)

    }

  }

  async function rejectWithdraw(id){

    const reason = prompt("Reason reject?")

    try{

      setActionLoading(id)

      await authFetch(`/api/v1/admin/withdraws/${id}/reject`,{
        method:"POST",
        body:JSON.stringify({reason})
      })

      fetchWithdraws()

    }catch(err){

      alert(err.message)

    }finally{

      setActionLoading(null)

    }

  }

  async function markPaid(id){

    try{

      setActionLoading(id)

      await authFetch(`/api/v1/admin/withdraws/${id}/mark-paid`,{
        method:"POST"
      })

      fetchWithdraws()

    }catch(err){

      alert(err.message)

    }finally{

      setActionLoading(null)

    }

  }

  /* ================= ANALYTICS ================= */

  const analytics = useMemo(()=>{

    const totalRevenue = withdraws.reduce((s,w)=>s+Number(w.amount),0)

    const approved = withdraws.filter(w=>w.status==="approved")
    const rejected = withdraws.filter(w=>w.status==="rejected")
    const paid = withdraws.filter(w=>w.status==="paid")

    const userMap={}

    withdraws.forEach(w=>{

      if(!userMap[w.user?.id]){

        userMap[w.user?.id]={
          name:w.user?.name,
          total:0,
          count:0
        }

      }

      userMap[w.user?.id].total+=Number(w.amount)
      userMap[w.user?.id].count++

    })

    const leaderboard = Object.values(userMap)
      .sort((a,b)=>b.total-a.total)
      .slice(0,5)

    const suspicious = withdraws.filter(w=>Number(w.amount)>10000000)

    return{
      totalRevenue,
      approvedCount:approved.length,
      rejectedCount:rejected.length,
      paidCount:paid.length,
      leaderboard,
      suspicious
    }

  },[withdraws])

  /* ================= CHART DATA ================= */

  const distributionData=[
    {name:"Approved",value:analytics.approvedCount},
    {name:"Rejected",value:analytics.rejectedCount},
    {name:"Paid",value:analytics.paidCount}
  ]

  const revenueChart = withdraws.map(w=>({
    date:new Date(w.created_at).toLocaleDateString(),
    amount:Number(w.amount)
  }))

  /* ================= UI ================= */

  return(

  <div className="p-4 md:p-8 text-white space-y-10">

    <h1 className="text-3xl md:text-4xl font-bold">
      Referral Admin Dashboard
    </h1>

    <ReferralTabs/>

    {/* ================= STATS ================= */}

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

      <StatCard
        icon={<DollarSign/>}
        label="Total Referral Revenue"
        value={`Rp ${analytics.totalRevenue.toLocaleString()}`}
      />

      <StatCard
        icon={<TrendingUp/>}
        label="Approved Withdraw"
        value={analytics.approvedCount}
      />

      <StatCard
        icon={<Users/>}
        label="Top Affiliates"
        value={analytics.leaderboard.length}
      />

      <StatCard
        icon={<AlertTriangle/>}
        label="Suspicious Activity"
        value={analytics.suspicious.length}
      />

    </div>

    {/* ================= CHARTS ================= */}

    <div className="grid md:grid-cols-2 gap-6">

      <ChartCard title="Commission Revenue Trend">

        <ResponsiveContainer width="100%" height={250}>

          <LineChart data={revenueChart}>

            <XAxis dataKey="date"/>
            <YAxis/>
            <Tooltip/>

            <Line
              type="monotone"
              dataKey="amount"
              stroke="#9333ea"
              strokeWidth={3}
            />

          </LineChart>

        </ResponsiveContainer>

      </ChartCard>

      <ChartCard title="Withdraw Distribution">

        <ResponsiveContainer width="100%" height={250}>

          <PieChart>

            <Pie
              data={distributionData}
              dataKey="value"
              nameKey="name"
              outerRadius={80}
            >

              <Cell fill="#22c55e"/>
              <Cell fill="#ef4444"/>
              <Cell fill="#3b82f6"/>

            </Pie>

            <Tooltip/>

          </PieChart>

        </ResponsiveContainer>

      </ChartCard>

    </div>

    {/* ================= LEADERBOARD ================= */}

    <ChartCard title="Top Affiliates">

      <table className="w-full text-sm">

        <thead className="text-gray-400 border-b border-gray-700">

          <tr>
            <th className="text-left py-2">User</th>
            <th>Total Commission</th>
            <th>Withdraw Count</th>
          </tr>

        </thead>

        <tbody>

          {analytics.leaderboard.map((u,i)=>(

            <tr key={i} className="border-b border-gray-800">

              <td className="py-2">{u.name}</td>

              <td>
                Rp {u.total.toLocaleString()}
              </td>

              <td>{u.count}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </ChartCard>

    {/* ================= WITHDRAW MANAGEMENT ================= */}

    <h2 className="text-2xl font-bold">
      Withdraw Requests
    </h2>

    <div className="flex gap-2 flex-wrap">

      {["pending","approved","paid","rejected"].map(s=>(
        <button
          key={s}
          onClick={()=>setStatusFilter(s)}
          className={`px-4 py-2 rounded-lg border ${
            statusFilter===s
            ? "bg-purple-600 border-purple-600"
            : "border-gray-700"
          }`}
        >
          {s}
        </button>
      ))}

    </div>

    <TableWrapper>

      {loading ?(

        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin"/>
        </div>

      ):(
      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="border-b border-gray-700 text-gray-300">

            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Email</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            {withdraws.map(w=>(
            <tr key={w.id} className="border-b border-gray-800">

              <td className="py-3">{w.id}</td>

              <td>{w.user?.name}</td>

              <td className="text-gray-400 text-xs">
                {w.user?.email}
              </td>

              <td className="text-green-400">
                Rp {Number(w.amount).toLocaleString()}
              </td>

              <td>{w.status}</td>

              <td>
                {new Date(w.created_at).toLocaleDateString()}
              </td>

              <td className="flex gap-2">

                {w.status==="pending"&&(
                <>
                  <button
                    onClick={()=>approveWithdraw(w.id)}
                    className="bg-green-600 px-3 py-1 rounded"
                  >
                    {actionLoading===w.id
                      ?<Loader2 className="animate-spin" size={14}/>
                      :<Check size={14}/>
                    }
                  </button>

                  <button
                    onClick={()=>rejectWithdraw(w.id)}
                    className="bg-red-600 px-3 py-1 rounded"
                  >
                    <X size={14}/>
                  </button>
                </>
                )}

                {w.status==="approved"&&(
                <button
                  onClick={()=>markPaid(w.id)}
                  className="bg-blue-600 px-3 py-1 rounded"
                >
                  <DollarSign size={14}/>
                </button>
                )}

              </td>

            </tr>
            ))}

          </tbody>

        </table>

      </div>
      )}

    </TableWrapper>

  </div>

  )

}

/* ================= COMPONENTS ================= */

function StatCard({icon,label,value}){

return(
<div className="bg-black border border-gray-800 rounded-xl p-4">

<div className="flex items-center gap-2 text-purple-400 mb-1">
{icon}
</div>

<p className="text-xs text-gray-400">
{label}
</p>

<p className="text-lg font-semibold">
{value}
</p>

</div>
)
}

function ChartCard({title,children}){

return(
<div className="bg-black border border-gray-800 rounded-xl p-6">

<h3 className="font-semibold mb-4">
{title}
</h3>

{children}

</div>
)
}