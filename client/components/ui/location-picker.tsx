"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import Icon from "@/components/ui/Icon"
import { cn } from "@/lib/utils"

export interface Province {
  id: number
  name: string
  districts: string[]
}

interface LocationPickerProps {
  provinces: Province[]
  selectedProvinces: number[]
  selectedDistricts: string[]
  onProvincesChange: (provinces: number[]) => void
  onDistrictsChange: (districts: string[]) => void
  className?: string
}

function LocationPicker({
  provinces,
  selectedProvinces,
  selectedDistricts,
  onProvincesChange,
  onDistrictsChange,
  className,
}: LocationPickerProps) {
  const [open, setOpen] = useState(false)
  const [searchProvince, setSearchProvince] = useState("")
  const [activeProvince, setActiveProvince] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredProvinces = provinces.filter(p =>
    p.name.toLowerCase().includes(searchProvince.toLowerCase())
  )

  const toggleProvince = (id: number) => {
    const newSelected = selectedProvinces.includes(id)
      ? selectedProvinces.filter(p => p !== id)
      : [...selectedProvinces, id]
    onProvincesChange(newSelected)
    setActiveProvince(id)
  }

  const toggleDistrict = (district: string) => {
    const newSelected = selectedDistricts.includes(district)
      ? selectedDistricts.filter(d => d !== district)
      : [...selectedDistricts, district]
    onDistrictsChange(newSelected)
  }

  const getDisplayText = () => {
    if (selectedProvinces.length === 0) return "Địa điểm"
    if (selectedProvinces.length === 1) {
      return provinces.find(p => p.id === selectedProvinces[0])?.name || "Địa điểm"
    }
    return `${selectedProvinces.length} địa điểm`
  }

  const activeProvinceData = provinces.find(p => p.id === activeProvince)

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Mobile Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex sm:hidden items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Icon name="location_on" size={20} className={selectedProvinces.length > 0 ? "text-[#00b14f]" : "text-gray-400"} />
      </button>

      {/* Desktop Button */}
      <button
        onClick={() => setOpen(!open)}
        className="hidden sm:flex items-center border-l border-gray-200 px-4 py-2 hover:bg-gray-50 transition-colors"
      >
        <Icon name="location_on" size={20} className="text-gray-400 mr-2" />
        <span className="text-gray-700">{getDisplayText()}</span>
        <Icon name={open ? "expand_less" : "expand_more"} size={20} className="text-gray-400 ml-1" />
      </button>

      {/* Mobile Dropdown - Full screen modal */}
      {open && (
        <>
          <div className="sm:hidden fixed inset-0 bg-black/50 z-[9998]" onClick={() => setOpen(false)} />
          <div className="sm:hidden fixed inset-x-4 top-20 bottom-20 bg-white rounded-xl shadow-2xl z-[9999] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Chọn địa điểm</h3>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <Icon name="close" size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center bg-gray-50 rounded-full px-4 py-2 mb-4">
                <Icon name="search" size={18} className="text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Tìm Tỉnh/Thành phố"
                  value={searchProvince}
                  onChange={(e) => setSearchProvince(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                />
              </div>
              <div className="space-y-1">
                {filteredProvinces.map((province) => (
                  <div
                    key={province.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors",
                      selectedProvinces.includes(province.id) ? "bg-green-50" : "hover:bg-gray-50"
                    )}
                    onClick={() => toggleProvince(province.id)}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                      selectedProvinces.includes(province.id)
                        ? "bg-[#00b14f] border-[#00b14f]"
                        : "border-gray-300"
                    )}>
                      {selectedProvinces.includes(province.id) && (
                        <Icon name="check" size={14} className="text-white" />
                      )}
                    </div>
                    <span className="text-gray-700 text-sm">{province.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setOpen(false)}
                className="w-full py-3 bg-[#00b14f] text-white rounded-full font-medium hover:bg-[#009643] transition-colors"
              >
                Xác nhận ({selectedProvinces.length} địa điểm)
              </button>
            </div>
          </div>
        </>
      )}

      {/* Desktop Dropdown */}
      {open && (
        <div className="hidden sm:block absolute top-full right-0 mt-2 w-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden">
          <div className="flex">
            <div className="w-1/2 border-r border-gray-200">
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center bg-gray-50 rounded-full px-4 py-2">
                  <Icon name="search" size={18} className="text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Nhập Tỉnh/Thành phố"
                    value={searchProvince}
                    onChange={(e) => setSearchProvince(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                {filteredProvinces.map((province) => (
                  <div
                    key={province.id}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors",
                      activeProvince === province.id && "bg-green-50"
                    )}
                    onClick={() => toggleProvince(province.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        selectedProvinces.includes(province.id)
                          ? "bg-[#00b14f] border-[#00b14f]"
                          : "border-gray-300"
                      )}>
                        {selectedProvinces.includes(province.id) && (
                          <Icon name="check" size={14} className="text-white" />
                        )}
                      </div>
                      <span className="text-gray-700 text-sm">{province.name}</span>
                    </div>
                    <Icon name="chevron_right" size={18} className="text-gray-400" />
                  </div>
                ))}
              </div>
            </div>

            <div className="w-1/2">
              <div className="p-3 border-b border-gray-100">
                <span className="text-[#00b14f] font-semibold text-sm">QUẬN/HUYỆN</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-4 scrollbar-hide">
                {activeProvinceData ? (
                  <div className="space-y-2">
                    {activeProvinceData.districts.map((district, idx) => (
                      <label key={idx} className="flex items-center gap-3 cursor-pointer py-2 hover:bg-gray-50 px-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedDistricts.includes(district)}
                          onChange={() => toggleDistrict(district)}
                          className="w-4 h-4 accent-[#00b14f]"
                        />
                        <span className="text-gray-700 text-sm">{district}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                    <Icon name="location_city" size={48} className="mb-3 opacity-50" />
                    <span className="text-sm">Vui lòng chọn Tỉnh/Thành phố</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { LocationPicker }
