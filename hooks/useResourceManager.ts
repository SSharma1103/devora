"use client";

import { useState, useCallback, useEffect } from "react";
import { ApiResponse } from "@/types";

interface Identifiable {
  id: number;
}
export function useResurceManager<T extends Identifiable>(
  endpoint: string,
  initialData?: T[]
) {
  const [loading, setloading] = useState(!initialData);
  const [items, setitems] = useState<T[]>(initialData || []);
  const [error, seterror] = useState<string | null>(null);
  const [processing, setprocessing] = useState(false);
  const fetchItems = useCallback(async () => {
    try {
      setloading(true);
      const res = await fetch(endpoint);
      const json: ApiResponse<T[]> = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch items");
      }
      if (json.data) {
        const dataArray = Array.isArray(json.data) ? json.data : [json.data];
        setitems(dataArray as T[]);
      }
    } catch (err: any) {
      seterror(err.message || "Error");
    } finally {
      setloading(false);
    }
  }, [endpoint]);
  useEffect(() => {
    if (!initialData) {
      fetchItems();
    }
  }, [initialData]);

  const additem = async (newitem: any) => {
    setprocessing(true);
    seterror(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newitem),
      });
      const json: ApiResponse<T> = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add item");
      if (json.data) {
        setitems((prev) => [json.data!, ...prev]);
        return true;
      }
    } catch (err: any) {
      seterror(err.message);
      return false;
    } finally {
      setprocessing(false);
    }
    return false;
  };
  const updateitems = async (id: number, updatedFields: any) => {
    setprocessing(true);
    seterror(null);
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      const json: ApiResponse<T> = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "cant update");
      }

      await fetchItems();
      return true;
    } catch (err: any) {
      seterror(err.message);
    } finally {
      setprocessing(false);
    }
  };
  const deleteitem = async (id: number) => {
    setprocessing(true);
    seterror(null);
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "DELETE",
      });
      const json: ApiResponse<T> = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "cant delete");
      }

      setitems((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (err: any) {
      seterror(err.message);
      return false;
    } finally {
      setprocessing(false);
    }
  };
  return {
    items,
    loading,
    processing,
    error,
    seterror,
    fetchItems,
    additem,
    updateitems,
    deleteitem,
  };
}
