'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface HeatmapData {
  day: string
  value: number
}

interface ActivityHeatmapProps {
  data: HeatmapData[]
}

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  // Son 365 günü haftalık gruplar halinde oluştur
  const weeks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Bugünün haftanın hangi günü olduğunu bul (0 = Pazar, 1 = Pazartesi, ...)
    const todayDayOfWeek = today.getDay()
    // Pazartesi'yi 0 yapmak için ayarla
    const adjustedDay = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1

    // Son 53 hafta (371 gün, ama sadece tam haftaları göster)
    const weeks: { date: Date; count: number }[][] = []

    // API'den gelen veriyi map'e çevir
    const dataMap = new Map(data.map(item => [item.day, item.value]))

    // Her hafta için 7 günlük array oluştur
    for (let weekIndex = 0; weekIndex < 53; weekIndex++) {
      const week: { date: Date; count: number }[] = []
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(today)
        // Haftanın başlangıcına git (Pazartesi)
        const daysToSubtract = adjustedDay + (weekIndex * 7) + (6 - dayIndex)
        date.setDate(date.getDate() - daysToSubtract)
        date.setHours(0, 0, 0, 0)

        const dateStr = date.toISOString().split('T')[0]
        const count = dataMap.get(dateStr) || 0

        week.push({ date, count })
      }
      weeks.push(week)
    }

    return weeks.reverse() // En eski hafta en başta
  }, [data])

  // En yüksek aktivite sayısını bul (renk yoğunluğu için)
  const maxCount = useMemo(() => {
    const allCounts = weeks.flat().map(d => d.count)
    return Math.max(...allCounts, 1)
  }, [weeks])

  // Renk seviyelerini belirle - Orange color scheme
  const getColorLevel = (count: number) => {
    if (count === 0) return 'bg-cream-dark/30 dark:bg-border-dark/30'
    const level = Math.ceil((count / maxCount) * 4)
    switch (level) {
      case 1: return 'bg-orange-200 dark:bg-orange-900/50'
      case 2: return 'bg-orange-300 dark:bg-orange-800/60'
      case 3: return 'bg-orange-400 dark:bg-orange-600'
      case 4: return 'bg-orange-500 dark:bg-orange-400'
      default: return 'bg-orange-500 dark:bg-orange-400'
    }
  }

  // Ay etiketleri için haftaları kontrol et
  const monthLabels = useMemo(() => {
    const labels: (string | null)[] = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    let lastMonth = -1

    weeks.forEach((week, weekIndex) => {
      // Haftanın ilk gününü (Pazartesi) kontrol et
      const firstDay = week[0].date
      const currentMonth = firstDay.getMonth()

      // Ay değiştiyse veya ilk haftaysa etiket ekle
      if (currentMonth !== lastMonth || weekIndex === 0) {
        labels.push(monthNames[currentMonth])
        lastMonth = currentMonth
      } else {
        labels.push(null)
      }
    })

    return labels
  }, [weeks])

  // Gün etiketleri (Pazartesi, Çarşamba, Cuma)
  const dayLabels = ['Mon', 'Wed', 'Fri']

  return (
    <Card className="border-cream-dark/50 dark:border-border-dark bg-cream dark:bg-surface-dark">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <div>
            <CardTitle className="text-foreground">Activity Heatmap</CardTitle>
            <CardDescription className="text-text-secondary">
              Your practice activity over the last year. Each square represents a day.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <div className="inline-flex gap-1">
            {/* Gün etiketleri (sol taraf) */}
            <div className="flex flex-col gap-1 pr-2 text-xs text-text-secondary justify-start pt-0.5">
              {dayLabels.map((label, idx) => (
                <div key={idx} className="h-3 flex items-center" style={{ height: '11px' }}>
                  {idx === 0 && <span className="mt-1">{label}</span>}
                </div>
              ))}
            </div>

            {/* Heatmap grid - Her hafta bir sütun */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => {
                    const fullDate = day.date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })

                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`w-3 h-3 rounded-sm ${getColorLevel(day.count)} transition-all hover:ring-2 hover:ring-primary hover:scale-110 cursor-pointer`}
                        title={`${fullDate}: ${day.count} ${day.count === 1 ? 'session' : 'sessions'}`}
                        style={{ minWidth: '11px', minHeight: '11px' }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Ay etiketleri (alt taraf) */}
          <div className="flex gap-1 mt-2 ml-8">
            {monthLabels.map((label, idx) => (
              <div
                key={idx}
                className="text-xs text-text-secondary"
                style={{ width: '11px', fontSize: '10px' }}
              >
                {label || ''}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-text-secondary">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-cream-dark/30 dark:bg-border-dark/30" />
              <div className="w-3 h-3 rounded-sm bg-orange-200 dark:bg-orange-900/50" />
              <div className="w-3 h-3 rounded-sm bg-orange-300 dark:bg-orange-800/60" />
              <div className="w-3 h-3 rounded-sm bg-orange-400 dark:bg-orange-600" />
              <div className="w-3 h-3 rounded-sm bg-orange-500 dark:bg-orange-400" />
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
