
<template>
  <b-card class="m-section">
    <b-icon-chevron-right v-show="open == false" @click="open = true" />
    <b-icon-chevron-down v-show="open == true" @click="open = false" />
    {{sectionName}}
    <b-collapse visible v-model="open">
      <slot />
    </b-collapse>
  </b-card>
</template>

<script>
import {BIconChevronRight, BIconChevronDown} from "bootstrap-vue"
export default {
  name: "CollapseSection",
  components: {
    BIconChevronRight,
    BIconChevronDown
  },
  data() {
    return {
      open: true
    }
  },
  props: {
    sectionName: {
      type: String,
      default () {
        return ""
      }
    }
  }
}
</script>
