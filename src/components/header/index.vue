<template>
  <div class="header">
    <div class="header__container">
      <div class="header__name">AIRESTO | {{ name }}</div>
      <button class="header__theme" @click="changeTheme">
        <svg v-if="theme === 'dark'" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="white" fill-opacity="0.08"/>
          <path d="M12.0001 14.4C13.3256 14.4 14.4001 13.3255 14.4001 12C14.4001 10.6746 13.3256 9.60004 12.0001 9.60004C10.6746 9.60004 9.6001 10.6746 9.6001 12C9.6001 13.3255 10.6746 14.4 12.0001 14.4Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 6V7.2M12 16.8V18M7.758 7.758L8.604 8.604M15.396 15.396L16.242 16.242M6 12H7.2M16.8 12H18M8.604 15.396L7.758 16.242M16.242 7.758L15.396 8.604" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-if="theme === 'light'" fill="black" width="16px" height="16px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.9210795,16.0557083 C18.806544,15.8557291 18.5888638,15.7466581 18.3681042,15.778451 C15.7143549,16.1614343 13.1464699,14.8027828 11.8279514,12.4996619 C10.4714937,10.1303294 10.5992437,7.15643277 12.1533805,4.92327491 C12.2845089,4.73479995 12.2953316,4.48267679 12.180826,4.2827289 C12.0663204,4.082781 11.8486103,3.97361621 11.6278806,4.00547157 C10.6028014,4.15336924 9.62953379,4.51221881 8.7351046,5.07207916 C5.10013507,7.34753369 3.91319343,12.2909608 6.08927802,16.0918777 C8.27199974,19.9044239 12.9936064,21.1335595 16.6280677,18.8585113 C17.5224371,18.2986822 18.2846616,17.571167 18.8935743,16.6962543 C19.0247325,16.5078419 19.0355552,16.2557187 18.9210795,16.0557083 Z"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { applyTheme } from '../../helpers'

defineProps<{name: string | undefined}>()

const theme = ref(localStorage.getItem('theme'))

function changeTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  applyTheme(theme.value)
}
</script>

<style lang="scss" scoped>
.header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    
    height: 44px;
    background: var(--bc-header);
    z-index: 1;

    &__container {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: space-between;
      justify-content: start;
      align-items: center;
      padding: 0px 20px;
    }

    &__name {
      margin: 0 auto;
      font-weight: 600;
      font-size: 11px;
      line-height: 14px;
      flex-grow: 1;
    }

    &__theme {
      all: unset;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      width: 24px;
      height: 24px;

      background: var(--bc-08);
      border-radius: 4px;

      &:hover {
        background: var(--bc-04);
      }
    }
}
</style>