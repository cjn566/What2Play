
<template>
  <b-list-group-item class="game-entry">
    <div class="thumbnail-container">
      <b-img-lazy class="thumb" v-if="game.thumbnail"  :src="game.thumbnail" height="80px"/>
      <b-skeleton-img v-else no-aspect height="50px" width="50px"/>
    </div>
    <b>{{game.name}}</b>
    <p>{{game.publishyear? game.publishyear: ''}}</p>
  </b-list-group-item>
</template>

<script>

export default {
  name: 'GameEntry',
  props: {
    game: {
      type: Object,
      default () {
        return {
          id: null,
          name: '',
          year: null,
          thumbnail: null
        }
      }
    },
  }
}

</script>
