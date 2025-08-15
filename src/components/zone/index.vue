<template>
  <button class="zone" :class="{'zone--selected': selectedZones?.indexOf(zone) !== -1}" @click="select(zone)">
    <div class="zone__title">{{ zone }}</div>
  </button>
</template>

<script lang="ts" setup>
import { defineProps, ref } from 'vue'
 
defineProps<{ zone: string }>()
const selectedZones = defineModel<string[]>('selectedZones')

function select(zone: string) {
	const index = selectedZones.value?.indexOf(zone)
  if (index === -1) {
    selectedZones.value?.push(zone)
  } else {
    selectedZones.value?.splice(index!, 1)
  }
}
</script>

<style lang="scss" scoped>
.zone {
    all: unset;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0px 6px;
    border-radius: 4px;
    width: fit-content;
    height: 24px;
    cursor: pointer;
    transition: all .3s ease;

    background: var(--bc-08);

    &--selected {
        background: var(--dark-blue);
    }

    &__title {
        display: flex;
        justify-content: center;
        align-items: center;

        font-weight: 400;
        font-size: 11px;
        line-height: 16px;
        color: var(--text-color);
    }
}
</style>