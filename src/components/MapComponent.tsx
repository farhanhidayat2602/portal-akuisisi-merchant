'use client'

import { useEffect, useRef } from 'react'
import { Merchant, Branch } from '@/types'
import { getStatusColor } from '@/lib/utils'

interface MapProps {
  branch: Branch
  merchants: Merchant[]
  selectedId?: string
  onSelectMerchant?: (merchant: Merchant) => void
  height?: string
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE:    '#00A651',
  LOCKED:       '#F5A623',
  INTERESTED:   '#8B5CF6',
  FOLLOW_UP:    '#3B82F6',
  REJECTED:     '#EF4444',
  DO_NOT_VISIT: '#9CA3AF',
  ACQUIRED:     '#059669',
}

export default function MapComponent({ branch, merchants, selectedId, onSelectMerchant, height = '400px' }: MapProps) {
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return

    let L: any
    let map: any

    async function initMap() {
      L = (await import('leaflet')).default

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      map = L.map(containerRef.current!, {
        center: [branch.lat, branch.lng],
        zoom: 14,
        zoomControl: true,
      })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      // Branch marker (blue star)
      const branchIcon = L.divIcon({
        html: `<div style="
          background:#003B79;color:white;
          width:36px;height:36px;border-radius:50% 50% 50% 0;
          display:flex;align-items:center;justify-content:center;
          font-size:16px;transform:rotate(-45deg);
          box-shadow:0 3px 10px rgba(0,59,121,0.4);
          border:3px solid white;
        "><span style="transform:rotate(45deg)">🏦</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        className: '',
      })

      L.marker([branch.lat, branch.lng], { icon: branchIcon })
        .addTo(map)
        .bindPopup(`<b>${branch.name}</b><br><small>Cabang Bank Mandiri</small>`)

      // Merchant markers
      markersRef.current = []
      merchants.forEach(m => {
        const color = STATUS_COLORS[m.status] ?? '#6B7280'
        const icon = L.divIcon({
          html: `<div style="
            background:${color};color:white;
            width:28px;height:28px;border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:12px;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
            border:2px solid white;
            ${selectedId === m.id ? 'transform:scale(1.3);box-shadow:0 4px 16px rgba(0,0,0,0.4);' : ''}
          ">🍽️</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          className: '',
        })

        const marker = L.marker([m.lat, m.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:'Plus Jakarta Sans',sans-serif;min-width:160px">
              <b style="font-size:13px">${m.name}</b>
              <div style="margin-top:6px;display:flex;align-items:center;gap:4px;font-size:11px;color:#6B7280">
                ⭐ ${m.googleRating ?? 'N/A'} · ${m.totalReviews ?? 0} ulasan
              </div>
              <button onclick="window.open('${m.googleMapsUrl}','_blank')"
                style="margin-top:8px;background:#003B79;color:white;border:none;
                       padding:5px 10px;border-radius:6px;font-size:11px;cursor:pointer;width:100%">
                Buka Maps
              </button>
            </div>
          `)

        marker.on('click', () => onSelectMerchant?.(m))
        markersRef.current.push({ id: m.id, marker })
      })
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [branch.id])

  // Pan to selected merchant
  useEffect(() => {
    if (!mapRef.current || !selectedId) return
    const m = merchants.find(x => x.id === selectedId)
    if (m) mapRef.current.panTo([m.lat, m.lng], { animate: true })
  }, [selectedId, merchants])

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%' }}
      className="rounded-2xl overflow-hidden z-0"
    />
  )
}
