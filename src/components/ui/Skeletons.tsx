'use client'

import React from 'react'

export function CharacterSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading character data...">
      {/* Hero skeleton */}
      <div className="flex justify-between items-end mb-8">
        <div className="space-y-2">
          <div className="h-3 w-48 bg-[#1f2629] rounded" />
          <div className="h-8 w-72 bg-[#1b2023] rounded" />
        </div>
        <div className="h-9 w-44 bg-[#1f2629] rounded" />
      </div>

      {/* Level Banner skeleton */}
      <div className="p-6 border border-[#293033] bg-[#111416] grid grid-cols-1 md:grid-cols-[150px_1fr_220px] gap-7 items-center">
        <div className="w-27 h-27 rounded-full border border-[#293033] bg-[#171b1d] mx-auto" />
        <div className="space-y-3">
          <div className="h-3 w-28 bg-[#1f2629] rounded" />
          <div className="h-7 w-40 bg-[#1b2023] rounded" />
          <div className="h-3 w-full max-w-md bg-[#171b1d] rounded" />
          <div className="h-1.5 w-full bg-[#1f2629] rounded" />
        </div>
        <div className="border-l border-[#293033] pl-5 space-y-2">
          <div className="h-3 w-24 bg-[#1f2629] rounded" />
          <div className="h-6 w-36 bg-[#1b2023] rounded" />
          <div className="h-3 w-28 bg-[#1f2629] rounded" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-6">
        <div className="p-6 border border-[#293033] bg-[#111416] space-y-6">
          <div className="flex justify-between">
            <div className="h-4 w-32 bg-[#1f2629] rounded" />
            <div className="h-3 w-20 bg-[#171b1d] rounded" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-3 w-12 bg-[#1f2629] rounded" />
                <div className="h-3 w-32 bg-[#171b1d] rounded" />
                <div className="h-4 w-16 bg-[#1f2629] rounded" />
              </div>
              <div className="h-1.5 w-full bg-[#1b2023] rounded" />
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="p-6 border border-[#293033] bg-[#111416] space-y-4">
            <div className="h-4 w-28 bg-[#1f2629] rounded" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-12 bg-[#171b1d] rounded" />
              <div className="h-12 bg-[#171b1d] rounded" />
              <div className="h-12 bg-[#171b1d] rounded" />
            </div>
          </div>
          <div className="p-5 border border-[#293033] bg-[#111416] h-24" />
        </div>
      </div>
    </div>
  )
}

export function QuestBoardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading quest board...">
      <div className="flex justify-between items-end mb-8">
        <div className="space-y-2">
          <div className="h-3 w-40 bg-[#1f2629] rounded" />
          <div className="h-8 w-64 bg-[#1b2023] rounded" />
        </div>
        <div className="h-9 w-36 bg-[#1f2629] rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-6">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 border border-[#293033] bg-[#111416] flex items-center gap-4 h-32"
            >
              <div className="w-10 h-10 bg-[#1f2629] rounded shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-[#171b1d] rounded" />
                <div className="h-5 w-48 bg-[#1b2023] rounded" />
                <div className="h-3 w-32 bg-[#171b1d] rounded" />
              </div>
              <div className="h-9 w-28 bg-[#1f2629] rounded shrink-0" />
            </div>
          ))}
        </div>

        <div className="p-6 border border-[#293033] bg-[#111416] space-y-4">
          <div className="h-3 w-20 bg-[#1f2629] rounded" />
          <div className="h-6 w-44 bg-[#1b2023] rounded" />
          <div className="h-12 bg-[#171b1d] rounded" />
          <div className="h-10 bg-[#1f2629] rounded" />
        </div>
      </div>
    </div>
  )
}
