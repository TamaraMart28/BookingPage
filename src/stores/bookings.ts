import { defineStore } from 'pinia'
import type { IBookingsResponse } from '@/types'
import axios from 'axios'

export const useBookingsStore = defineStore('bookings', {
  state: () => ({
    bookings: {} as IBookingsResponse,
    loading: false,
  }),
  getters: {
    availableDays: (state) => state.bookings?.available_days,
    availableZones: (state) => { 
        const zones = state.bookings?.tables?.map(table => table.zone)
        return Array.from(new Set(zones)) as string[]
    },
    timeZone: (state) => state.bookings?.restaurant.timezone,
    currentDate: (state) => state.bookings?.current_day,
    opening_time: (state) => state.bookings?.restaurant.opening_time,
    closing_time: (state) => state.bookings?.restaurant.closing_time,
    restaurantName: (state) => state.bookings?.restaurant?.restaurant_name,
    loading_status: (state) => state.loading,
  },
  actions: {
    async getBookings() {
        try {
          this.loading = true
          const response = await axios.get('https://hh.frontend.ark.software/api/booking')
          this.bookings = response.data
        }
        catch(ex) {
          console.error('Ошибка загрузки бронирований')
        }
        finally {
          this.loading = false
        }
    },
  }
})