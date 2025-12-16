"use client"

import { useState, useCallback,useEffect } from "react"
import { ApiResponse } from "@/types"
import { error } from "console"

interface Identifiable{
    id:number
}
export function useResurceManager<T extends Identifiable>(
    endpoint:string,
    initialData?:T[]
){
    const [loading , setloading]=useState(!initialData)
    const [items,setitems]=useState<T[]>(initialData||[])
    const [error,seterror]=useState<string|null>(null)
    const [processing,setprocessing]=useState(false)
    const fetchItems =useCallback(async ()=>{
        try {
            setloading(true);
            const res = await fetch(endpoint)
            const json :ApiResponse<T[]>=await res.json()

            if (!res.ok){throw new Error(json.error || "Failed to fetch items")}
            if(json.data)setitems(json.data)
        }catch(err:any){
            seterror(err.message||"Error")
        }finally{
            setloading(false)
        }
        useEffect(()=>{
            if(!initialData){
                fetchItems()
            }
        },[initialData,fetchItems])

    },[endpoint])git

    const additem= async (newitem:any)=>{
        setprocessing(true);
        seterror(null)
        
    }

}