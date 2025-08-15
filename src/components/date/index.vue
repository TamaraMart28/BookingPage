<template>
  <button class="date" :class="{'date--selected': selectedDate === props.date}" @click="select">
    <div class="date__title">{{ dateTitle }}</div>
    <div class="date__desc">{{ dateDesc }}</div>
  </button>
</template>

<script setup lang="ts">
import { computed, defineProps } from 'vue'
import { formatter } from '../../helpers'

interface IDate {
    date: string,
    timeZone: string
}

const props = defineProps<IDate>()
const selectedDate = defineModel<string>('selectedDate')

const date = new Date(props.date)
date.setHours(0, 0, 0, 0)

const dateTitle = computed(() => formatter('ru-RU', { timeZone: props.timeZone, day: 'numeric', month: 'long' }, date))

const dateDesc = computed(() => {
    const today = new Date(formatter('en-EN', { timeZone: props.timeZone, day: 'numeric', month: 'numeric', year: 'numeric' }, new Date))
    
    const diff = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)

    switch(diff) {
        case -1:
            return 'вчера'
        case 0:
            return 'сегодня'
        case 1:
            return 'завтра'
        default:
            return formatter('ru-RU', { timeZone: props.timeZone, weekday: 'long' }, date)
    }
})

function select() {
	selectedDate.value = props.date
}
</script>

<style lang="scss" scoped>
.date {
    all: unset;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 4px 8px;
    border-radius: 8px;
    width: fit-content;
    cursor: pointer;
    transition: all .3s ease;

    background: var(--bc-04);

    &--selected {
        background: var(--dark-blue);
    }

    &__title,
    &__desc {
        font-weight: 600;
        font-size: 11px;
        line-height: 14px;

        display: flex;
        align-items: center;

        color: var(--text-color);
    }

    &__desc {
        font-weight: 400;
    }
}
</style>