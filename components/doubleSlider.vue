
<template>
  <VueSlider :value="value" @change="update" v-bind="options"/>
</template>

<script>

import { debounce } from 'debounce'
import VueSlider from 'vue-slider-component'

export default {
  name: 'DoubleSlider',
  components: {
    VueSlider
  },
  data: {
    timeout: null
  },
  props: {
    value: {
      type: Array,
      default () {
        return [0,0]
      }
    },
    options: {
      type: Object,
      default () {
        return {}
      }
    },
    debounce: {
      type: Number,
      default: 500
    }
  },
  methods: {
    update (val) {
      if (this.timeout) clearTimeout(this.timeout)
      this.timeout = setTimeout(() => {
        this.$emit('input', val)
      }, 300)
    }
  }
}

</script>
