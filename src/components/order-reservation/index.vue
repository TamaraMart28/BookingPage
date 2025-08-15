<template>
  <div 
    class="order-reservation"
    :class="[
        {'order-reservation--order': 'start_time' in orderReservation},
        {'order-reservation--reservation': 'seating_time' in orderReservation},
        {'order-reservation--banquet': orderReservation.status === banquetStatus},
        {'order-reservation--queue': orderReservation.status === ReservationStatus.Queue}
    ]"
    :style="{
        top: top + '%',
        height: height + '%',
        width: width + 'px',
        left: left + 'px'
    }"
  >
    <div class="order-reservation__content">
        <div v-if="'start_time' in orderReservation" class="order-reservation__title">{{title}}</div>
        <div v-if="'seating_time' in orderReservation" class="order-reservation__number">№{{orderReservation.id}}</div>
        <div v-if="'seating_time' in orderReservation" class="order-reservation__info">
            <div class="order-reservation__name">{{orderReservation.name_for_reservation}};</div>
            <div class="order-reservation__num-people">{{orderReservation.num_people}}<span>чел</span></div>
        </div>
        <div
            v-show="orderReservation.status !== banquetStatus"
            class="order-reservation__status"
            :class="[
                {'order-reservation__status--bill': orderReservation.status === billStatus},
                {'order-reservation__status--queue': orderReservation.status === ReservationStatus.Queue},
                {'order-reservation__status--new': orderReservation.status === ReservationStatus.New},
                {'order-reservation__status--request': orderReservation.status === ReservationStatus.Request},
                {'order-reservation__status--open': orderReservation.status === ReservationStatus.Open},
                {'order-reservation__status--closed': orderReservation.status === ReservationStatus.Closed},
            ]"
        >
            {{
                "start_time" in orderReservation
                ? OrderStatus[orderReservation.status]
                : getStatusLabel(orderReservation.status)
            }}

        </div>
        <div v-if="'phone_number' in orderReservation" class="order-reservation__phone">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.99975 7.98954V9.19386C10.0002 9.30566 9.97726 9.41633 9.93238 9.51876C9.8875 9.6212 9.82168 9.71316 9.73913 9.78874C9.65659 9.86432 9.55913 9.92187 9.45301 9.95768C9.34689 9.9935 9.23444 10.0068 9.12287 9.99674C7.88512 9.86252 6.69617 9.4404 5.65156 8.76432C4.67969 8.14797 3.85571 7.32562 3.23813 6.35567C2.55834 5.3084 2.1353 4.11603 2.00326 2.87518C1.99321 2.76417 2.00643 2.65228 2.04208 2.54665C2.07773 2.44102 2.13503 2.34395 2.21032 2.26163C2.28562 2.1793 2.37727 2.11353 2.47943 2.06849C2.58159 2.02346 2.69203 2.00014 2.80372 2.00004H4.01043C4.20564 1.99812 4.39489 2.06711 4.5429 2.19415C4.69091 2.32119 4.78759 2.4976 4.81491 2.69052C4.86584 3.07593 4.9603 3.45435 5.09647 3.81857C5.15059 3.96225 5.1623 4.11841 5.13022 4.26853C5.09814 4.41866 5.02361 4.55646 4.91547 4.66561L4.40462 5.17544C4.97723 6.18046 5.81103 7.01261 6.81805 7.58408L7.32889 7.07425C7.43826 6.96632 7.57633 6.89194 7.72675 6.85992C7.87718 6.8279 8.03364 6.83959 8.17761 6.8936C8.54255 7.02951 8.92173 7.12378 9.3079 7.17461C9.5033 7.20212 9.68174 7.30035 9.80931 7.4506C9.93687 7.60085 10.0046 7.79266 9.99975 7.98954Z" stroke="var(--text-color)" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
             {{ orderReservation.phone_number }}
        </div>
        <div class="order-reservation__time">{{time}}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { IOrder, IReservation, OrderStatusKey } from '../../types'
import { OrderStatus, ReservationStatus, ReservationStatusLabel } from '../../types'
import { computed } from 'vue';
import { getTimeFromString, getTopPercent } from '../../helpers'
import { DateTime } from 'luxon'

const props = defineProps<{
    orderReservation: (IOrder | IReservation),
    start: string,
    end: string,
    cellHeight: number,
    width: number,
    left: number,
}>()

const startDT = computed(() => DateTime.fromISO(
    "start_time" in props.orderReservation ?
    props.orderReservation.start_time.replace(/(\.\d{3})\d{3}/, '$1') : 
    props.orderReservation.seating_time.replace(/(\.\d{3})\d{3}/, '$1'), {setZone: true}
))
const endDT = computed(() => DateTime.fromISO(props.orderReservation.end_time.replace(/(\.\d{3})\d{3}/, '$1'), {setZone: true}))

const top = computed(() => {
  const _ = props.cellHeight
  return getTopPercent(startDT.value, props.start, props.end, _)
});

const height = computed(() => {
  const _ = props.cellHeight
  return (
    getTopPercent(endDT.value, props.start, props.end, _) -
    top.value
  )
})

const banquetStatus: OrderStatusKey = 'Banquet'
const billStatus: OrderStatusKey = 'Bill'

const title = computed(() => {
    return (props.orderReservation.status === banquetStatus) ? OrderStatus[banquetStatus] : 'Заказ'
})

function getStatusLabel(status: string) {
  return ReservationStatusLabel[
    Object.entries(ReservationStatus).find(([_, v]) => v === status)?.[0] as keyof typeof ReservationStatusLabel
  ]
}

const time = computed(() => {
    return getTimeFromString(
        "start_time" in props.orderReservation ? 
        props.orderReservation.start_time : 
        props.orderReservation.seating_time
    ) + 
    '-' +
    getTimeFromString(props.orderReservation.end_time)
})
</script>

<style lang="scss" scoped>
.order-reservation {
    position: absolute;
    color: var(--text-color);
    display: flex;
    flex-direction: column;
    border-radius: 4px;
    overflow: hidden;

    cursor: pointer;
    &:hover {
        backdrop-filter: blur(4px);
        min-width: min-content;
        min-height: min-content;
        z-index: 99;
    }

    &--order {
        background: linear-gradient(90deg, var(--cyan) 2px, var(--cyan-16) 2px);
    }

    &--reservation {
        background: linear-gradient(90deg, var(--orange) 2px, var(--orange-16) 2px);
    }

    &--banquet {
        background: linear-gradient(90deg, var(--purple) 2px, var(--purple-16) 2px);
    }

    &--queue {
        background: linear-gradient(90deg, var(--dark-blue) 2px, var(--blue-16) 2px);
    }
    
    &__content {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-left: 6px;
        padding: 2px;
        color: var(--text-color);

        flex: none;
        order: 1;
        align-self: stretch;
        flex-grow: 1;
    }

    &__title {
        font-weight: 600;
        font-size: 11px;
        line-height: 14px;
    }

    &__number {
        font-weight: 400;
        font-size: 8px;
        line-height: 8px;
    }

    &__info {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        align-content: flex-start;
        gap: 0px 4px;
    }

    &__name,
    &__num-people {
        font-weight: 600;
        font-size: 11px;
        line-height: 14px;

        span {
            font-weight: 400;
            font-size: 8px;
            line-height: 8px;
        }
    }

    &__status {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 2px;
        border-radius: 4px;

        font-weight: 600;
        font-size: 8px;
        line-height: 8px;
        white-space: nowrap;

        background: var(--bc-12);

        &--queue,
        &--closed {
            background: var(--bc-12);
        }
        &--new {
            background: var(--dark-blue);
        }
        &--request {
            background: var(--blue-01);
            color: var(--blue);
        }
        &--open,
        &--bill {
            background: var(--cyan-32);
        }
    }

    &__phone {
        display: flex;
        align-items: center;

        font-weight: 400;
        font-size: 11px;
        line-height: 14px;
    }

    &__time {
        min-width: 38px;
        font-weight: 400;
        font-size: 11px;
        line-height: 14px;
    }
}
</style>