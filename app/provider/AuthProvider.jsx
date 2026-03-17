"use client"

import { createContext, useContext, useEffect, useState } from "react"
import Cookies from "js-cookie"

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  const [user,setUser] = useState(null)
  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    const token = Cookies.get("token")

    if(!token){
      setLoading(false)
      return
    }

    try{

      const cachedUser = localStorage.getItem("user")

      if(token && cachedUser){

      const parsedUser = JSON.parse(cachedUser)

      setUser(parsedUser)

      }

    }catch{}

    setLoading(false)

  },[])

  const login = (user,token)=>{

    Cookies.set("token",token,{path:"/"})

    localStorage.setItem("user",JSON.stringify(user))

    setUser(user)

  }

  const logout = ()=>{

    Cookies.remove("token")

    localStorage.removeItem("user")

    setUser(null)

  }

  return(
    <AuthContext.Provider value={{user,setUser,login,logout,loading}}>
      {children}
    </AuthContext.Provider>
  )

}

export const useAuth = ()=>useContext(AuthContext)