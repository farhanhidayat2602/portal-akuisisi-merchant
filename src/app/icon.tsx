import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: '#003B79',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Store / shop SVG */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          {/* Roof/awning */}
          <path d="M2 7h20l-2 4H4L2 7z" fill="#F5A623" />
          {/* Building body */}
          <rect x="4" y="11" width="16" height="10" rx="1" fill="white" />
          {/* Door */}
          <rect x="9.5" y="15" width="5" height="6" rx="1" fill="#003B79" />
          {/* Window left */}
          <rect x="5" y="13" width="3.5" height="3" rx="0.5" fill="#003B79" />
          {/* Window right */}
          <rect x="15.5" y="13" width="3.5" height="3" rx="0.5" fill="#003B79" />
          {/* Awning line detail */}
          <path d="M2 7h20" stroke="#E8940F" strokeWidth="0.5" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
