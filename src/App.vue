<template>
  <div v-if="bookingsStore.loading_status" class="loader">
    <div class="loader__spinner"></div>
    <p>Загрузка бронирований...</p>
  </div>
  <div v-else>
    <Header :name="bookingsStore.restaurantName"></Header>
    <div class="booking-title">Бронирования</div>
    <div class="container-dates">
      <div class="container-title">Дата</div>
      <div class="dates">
        <DateStamp
          v-for="date in bookingsStore.availableDays"
          :key="date"
          :date="date"
          :timeZone="bookingsStore.timeZone"
          v-model:selectedDate="selectedDate"
        />
      </div>
    </div>
    <div class="container-zones">
      <div class="container-title">Отображаемые зоны</div>
      <div class="zones">
        <Zone
          v-for="zone in bookingsStore.availableZones"
          :key="zone"
          :zone="zone"
          v-model:selectedZones="selectedZones"
        />
      </div>
    </div>
    <div class="table" :style="[cellHeightStyle, cellWidthStyle, timeLineTopStyle, tableWidth]">
      <div class="head-column">
        <div class="empty-cell"></div>
        <div class="cell" v-for="time in timeStamps" :key="time">{{ time.endsWith("5") ? '' : time }}</div>
      </div>
      <div class="column" v-for="table in filteredTablesWithPositions" :key="table.id">
        <div class="head-cell">
          <div>#<span>{{ table.number }}</span>{{ table.capacity }} чел</div>
          <div>{{ table.zone }}</div>
        </div>
        <div class="column-overlay">
          <div class="cell" v-for="ts in timeStamps" :key="ts" :data-time="ts"></div>
          <div class="timeiline"></div>
          <OrderReservation
            v-for="or in table.ordersAndReservations"
            :key="or.id"
            :orderReservation="or"
            :start="startTimeStamp"
            :end="endTimeStamp"
            :cellHeight="cellHeight"
            :width="or.width"
            :left="or.left"
          />
        </div>
      </div>
    </div>
    <div class="zoom">
      Масштаб
      <div class="zoom__control">
        <button class="zoom__minus" @click="zoomMinus">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.5 8H11.5" stroke="var(--text-color)" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="zoom__plus" @click="zoomPlus">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.5 8H11.5" stroke="var(--text-color)" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 4.5V11.5" stroke="var(--text-color)" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DateStamp from "./components/date/index.vue"
import Zone from "./components/zone/index.vue"
import OrderReservation from "./components/order-reservation/index.vue"
import Header from './components/header/index.vue'
import { useBookingsStore } from './stores/bookings'
import { computed, onMounted, onUnmounted, ref, watch, type Ref } from "vue"
import { getCurrentDateInZone, getTopPercent } from "./helpers"
import { DateTime } from "luxon"
import type { ITable, IOrder, IReservation } from "./types"

const tables: Ref<ITable[]> = ref([])
let startTimeStamp = ''
let endTimeStamp = ''
const selectedDate = ref()
const selectedZones: Ref<string[]> = ref([])
const bookingsStore = useBookingsStore()
const timeStamps = ref()
const currentTime = ref()
let timer: ReturnType<typeof setInterval>

const stepX = 16
const stepY = 2
const cellWidthMin = 80
const cellHeightMin = 20
const cellWidth = ref(cellWidthMin)
const cellHeight = ref(cellHeightMin)
const timeLineTop = ref(0)

onMounted(async () => {
  await bookingsStore.getBookings()
  selectedDate.value = bookingsStore.currentDate
  selectedZones.value = [...bookingsStore.availableZones]
  timeStamps.value = generateTimeStamps(bookingsStore.opening_time, bookingsStore.closing_time)
  currentTime.value = getCurrentDateInZone(bookingsStore.timeZone)
  timer = setInterval(() => {
    currentTime.value = getCurrentDateInZone(bookingsStore.timeZone)
  }, 60000)
  tables.value = bookingsStore.bookings.tables
})

onUnmounted(() => {
  clearInterval(timer)
})

function processOrdersAndReservations(array: (IOrder | IReservation)[], cellWidth: number, offsetPx = 4) {
  const processed: any[] = []

  const getStart = (itm: (IOrder | IReservation)) =>
    DateTime.fromISO("start_time" in itm ? itm.start_time : itm.seating_time)

  const timesOverlap = (a: any, b: any) => {
    const aS = getStart(a)
    const aE = DateTime.fromISO(a.end_time)
    const bS = getStart(b)
    const bE = DateTime.fromISO(b.end_time)
    return aS < bE && aE > bS
  }

  for (const item of array) {
    const start = getStart(item)
    const end = DateTime.fromISO(item.end_time)

    // Группа по правилу 2
    const group = array
      .filter((itm) => Math.abs(getStart(itm).diff(start, "minutes").minutes) <= 30)
      .sort((a, b) => getStart(a).toMillis() - getStart(b).toMillis())

    const groupIndex = group.findIndex((g) => g.id === item.id)

    const groupStart = group.reduce<DateTime>((min, g) => {
      const s = getStart(g)
      return s < min ? s : min
    }, start)

    const groupIds = new Set(group.map((g) => g.id as string | number))

    // Предыдущие, пересекаются с groupStart и не входят в текущую группу
    const overlappingProcessed = processed.filter((p) => {
      if (groupIds.has(p.id as string | number)) return false
      const pStart = getStart(p)
      const pEnd = DateTime.fromISO(p.end_time)
      return pStart <= groupStart && pEnd > groupStart
    })

    let leftOffset = 0

    if (overlappingProcessed.length > 0) {
      const layersOffset = overlappingProcessed.length * offsetPx
      // Наибольший левый отступ
      const maxExistingLeft = Math.max(...overlappingProcessed.map((p) => p.left || 0))
      const relativeOffset = maxExistingLeft + offsetPx
      const genericOffset = Math.min(Math.max(layersOffset, relativeOffset), cellWidth)

      // *
      let noOffsetByPastPair = false

      for (const op of overlappingProcessed) {
        const w = Math.round(op.width || 0)

        // Все уже размещённые с той же шириной
        const sameWidthPeers = processed.filter((p) => Math.round(p.width || 0) === w)

        if (sameWidthPeers.length < 2) continue

        // Те, кто когда-то пересекался по времени с op
        const peersThatOverlappedOpBefore = sameWidthPeers.filter((p) => p !== op && timesOverlap(p, op))
        if (peersThatOverlappedOpBefore.length === 0) continue

        // Самая левая колонка
        const firstPeer = peersThatOverlappedOpBefore.reduce(
          (minP, p) => (p.left < minP.left ? p : minP),
          peersThatOverlappedOpBefore[0]
        )

        const hitFirstNow = timesOverlap(item as any, firstPeer)

        if (!hitFirstNow && firstPeer.left < op.left) {
          noOffsetByPastPair = true
          break
        }
      }

      if (noOffsetByPastPair) {
        leftOffset = 0
      } else {
        const byWidth = new Map<number, any[]>()
        for (const p of overlappingProcessed) {
          const w = Math.round(p.width);
          (byWidth.get(w) ?? byWidth.set(w, []).get(w)!).push(p)
        }

        let equalWidthGroup: any[] | null = null
        for (const arr of byWidth.values()) {
          if (arr.length >= 2 && (!equalWidthGroup || arr.length > equalWidthGroup.length)) {
            equalWidthGroup = arr
          }
        }

        const intersectsNow = (p: any) => {
          const s = getStart(p)
          const e = DateTime.fromISO(p.end_time)
          return start < e && end > s
        }

        if (equalWidthGroup) {
          const topByLeft = new Map<number, any>()
          for (const p of equalWidthGroup) {
            const curr = topByLeft.get(p.left)
            if (!curr || getStart(p) < getStart(curr)) topByLeft.set(p.left, p)
          }
          const topRow = [...topByLeft.values()]
          const firstTop = topRow.reduce((minP, p) => (p.left < minP.left ? p : minP), topRow[0])
          const firstLeft = firstTop.left

          const hitFirstColumn = overlappingProcessed.some((p) => p.left === firstLeft && intersectsNow(p))
          const hitOnlyOtherEqualWidthCols =
            !hitFirstColumn && equalWidthGroup.some((p) => p.left !== firstLeft && intersectsNow(p))
          const hitOutsideEqualWidthGroup = overlappingProcessed
            .filter((p) => !equalWidthGroup.includes(p))
            .some(intersectsNow)

          if (hitFirstColumn) {
            leftOffset = Math.min(firstLeft + offsetPx, cellWidth)
          } else if (hitOnlyOtherEqualWidthCols && !hitOutsideEqualWidthGroup) {
            leftOffset = 0
          } else {
            leftOffset = genericOffset
          }
        } else {
          leftOffset = genericOffset
        }
      }
    }

    // Ширина/позиция внутри своей группы
    const available = Math.max(cellWidth - leftOffset, 0)
    const width = Math.floor(available / Math.max(group.length, 1))
    let left = leftOffset + groupIndex * width

    if (left + width > cellWidth) {
      left = Math.max(cellWidth - width, 0)
    }

    processed.push({ ...item, width, left })
  }

  return processed
}

const filteredTablesWithPositions = computed(() => {
  return tables.value
    .filter(t => selectedZones.value.includes(t.zone))
    .map(t => {
      const filteredOrders = t.orders.filter(o => {
        const orderDate = DateTime.fromISO(
          o.start_time.replace(/(\.\d{3})\d{3}/, "$1"),
          { setZone: true }
        ).toISODate()
        return orderDate === selectedDate.value
      })

      const filteredReservations = t.reservations.filter(r => {
        const reservationDate = DateTime.fromISO(
          r.seating_time.replace(/(\.\d{3})\d{3}/, "$1"),
          { setZone: true }
        ).toISODate()
        return reservationDate === selectedDate.value
      })

      const resultArray = [...filteredOrders, ...filteredReservations].sort((a, b) => {
        const aStart = "start_time" in a ? a.start_time : a.seating_time
        const bStart = "start_time" in b ? b.start_time : b.seating_time
        return DateTime.fromISO(aStart).toMillis() - DateTime.fromISO(bStart).toMillis()
      })

      return {
        ...t,
        ordersAndReservations: processOrdersAndReservations(resultArray, cellWidth.value),
      }
    })
})

function zoomPlus() {
  cellHeight.value += stepY
  cellWidth.value += stepX
}
function zoomMinus() {
  cellHeight.value = Math.max(cellHeightMin, cellHeight.value - stepY)
  cellWidth.value = Math.max(cellWidthMin, cellWidth.value - stepX)
}

const cellHeightStyle = computed(() => ({
  '--cell-height': cellHeight.value + 'px',
}))
const cellWidthStyle = computed(() => ({
  '--cell-width': cellWidth.value + 'px',
}))

watch(currentTime, (newValue) => {
  timeLineTop.value = getTopPercent(newValue, startTimeStamp, endTimeStamp, cellHeight.value)
})
const timeLineTopStyle = computed(() => ({
  '--timeline-top': timeLineTop.value + '%',
}))

const tableWidth = computed(() => ({
  '--table-width': (filteredTablesWithPositions.value.length * cellWidth.value) + 'px',
}))

function roundToStep(date: Date, stepMinutes: number, roundUp: boolean) {
  const totalMinutes = date.getHours() * 60 + date.getMinutes()
  const roundedMinutes = roundUp
    ? Math.ceil(totalMinutes / stepMinutes) * stepMinutes
    : Math.floor(totalMinutes / stepMinutes) * stepMinutes

  const result = new Date(date)
  result.setHours(Math.floor(roundedMinutes / 60), roundedMinutes % 60, 0, 0)
  return result
}

function generateTimeStamps(start: string, end: string, stepMinutes: number = 15) {
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)

  let date = new Date()
  date.setHours(startH, startM, 0, 0)
  const roundedStart = roundToStep(date, stepMinutes, false)
  date.setHours(endH, endM, 0, 0)
  const roundedEnd = roundToStep(date, stepMinutes, true)

  const times: string[] = []
  for (let current = new Date(roundedStart); current <= roundedEnd; current.setMinutes(current.getMinutes() + stepMinutes)) {
    const hh = current.getHours().toString().padStart(2, '0')
    const mm = current.getMinutes().toString().padStart(2, '0')
    times.push(`${hh}:${mm}`)
  }

  startTimeStamp = times[0]
  let afterRoundedEnd = new Date(roundedEnd)
  afterRoundedEnd.setMinutes(afterRoundedEnd.getMinutes() + stepMinutes)
  endTimeStamp = `${afterRoundedEnd.getHours().toString().padStart(2, '0')}:${afterRoundedEnd.getMinutes().toString().padStart(2, '0')}`

  return times
}
</script>

<style lang="scss" scoped>
.column-overlay {
  position: relative;
}

.booking-title {
  position: absolute;
  left: 20px;
  top: 76px;

  font-weight: 700;
  font-size: 20px;
  line-height: 28px;
}

.container-dates,
.container-zones {
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  position: absolute;
  height: 54px;
  left: 20px;
  top: 120px;
}

.container-zones {
  height: 42px;
  top: 190px;
}

.container-title {
  font-weight: 400;
  font-size: 11px;
  line-height: 14px;

  color: var(--tc-64);
}

.dates, .zones {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table {
  position: absolute;
  top: 265px;
  left: 0;
  padding-left: 20px;
  padding-right: calc(100% - (var(--table-width) + 52px));
  z-index: 1;
  background: var(--background-color);

  display: flex;

  .head-column {
    width: 32px;
    position: sticky;
    left: 0;

    .empty-cell {
      height: calc((2 * var(--cell-height)) + 8px);
      position: sticky;
      top: 0;
      z-index: 2;
      background: var(--background-color);
    }

    .cell {
      z-index: 1;

      height: var(--cell-height);

      font-weight: 400;
      font-size: 11px;
      line-height: 14px;

      color: var(--tc-48);
    }
  }

  .column {
    width: var(--cell-width);

    .head-cell {
      position: sticky;
      top: 0;
      z-index: 2;

      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      height: calc((2 * var(--cell-height)) + 8px);
      max-height: calc((2 * var(--cell-height)) + 8px);

      font-weight: 400;
      font-size: 11px;
      line-height: 14px;
      text-align: center;
      
      div:last-child {
        overflow: hidden;
      }

      color: var(--tc-64);
      background: var(--background-color);

      span {
        color: var(--text-color);
        font-weight: 600;
        font-size: 13px;
        line-height: 20px;
        padding-right: 4px;
      }
    }

    .cell {
      box-shadow: inset -1px 0 var(--bc-16);
      height: var(--cell-height);
    }

    .cell:nth-child(even) {
      box-shadow: inset -1px -1px var(--bc-16);
    }

    .cell:first-child {
      box-shadow: inset -1px 1px var(--bc-16);
    }

    .cell:last-child {
      box-shadow: inset -1px 0px var(--bc-16);
    }

    .cell:hover {
      background: var(--bc-04);

      &::after {
        content: attr(data-time);
        font-weight: 400;
        font-size: 11px;
        line-height: 14px;
        color: var(--tc-48);
        padding-left: 4px;
      }
    }
  }
}

.zoom {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 8px;
  gap: 4px;
  z-index: 100;

  background: var(--bc-zoom);
  border: 1px solid var(--bc-16);
  border-radius: 8px;

  font-weight: 600;
  font-size: 13px;
  line-height: 16px;

  position: fixed;
  width: 89px;
  height: 60px;
  right: 20px;
  bottom: 20px;

  &__control {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 52px;
    height: 24px;
  }

  &__minus, &__plus {
    all: unset;
    cursor: pointer;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0px 4px;

    width: 24px;
    height: 24px;

    background: var(--bc-08) ;
    border-radius: 4px;

    &:active {
      background: var(--bc-04);
    }
  }
}

.timeiline {
  position: absolute;
  width: 100%;
  height: 1px;
  top: var(--timeline-top);

  background: var(--light-orange);
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;

  &__spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--bc-12);
    border-top-color: var(--dark-blue);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 10px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>