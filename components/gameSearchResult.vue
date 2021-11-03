
<template>
  <b-list-group-item button size="sm">
    <b-row>
    <b-col>
      <b-img-lazy v-if="game.thumbnail"  :src="game.thumbnail" height="80px" />
      <b-skeleton-img v-else no-aspect height="50px" width="50px"/>
    </b-col>
    <b-col>
      <b>{{game.name}}</b>
      <p>{{game.year? game.year: 'N/A'}}</p>
    </b-col>
    </b-row>
  </b-list-group-item>
</template>

<script>

export default {
  name: 'GameSearchResult',
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
