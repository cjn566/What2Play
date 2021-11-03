<template>
  <b-container fluid id="app">
    <b-row>
      <b-col cols="6">
        <b-form-group
          label-cols
          label="Load from BGG Collection">
          <b-input-group>
            <b-form-input
              v-model="username"
              v-on:keyup.enter="getCollection"
              :state="usernameValidationState"
              type="search" />
            <b-input-group-append is-text style="cursor:pointer" @click="getCollection">
                <BIconSearch/>
            </b-input-group-append>
          </b-input-group>
        </b-form-group>

        <button @click="openGameSearchModal()">
          Add Games
        </button>
        <b-modal v-model="search.showModal" title="Add a Game">
            <b-form-group
              label-cols
              label="Game Name">
              <b-form-input
                v-model="search.query"
                ref="search-box"
                debounce="500"
                @update="gameSearch"
                v-on:keyup.enter="gameSearch(search.query)"
                type="search" />
            </b-form-group>
            <div v-show="search.basegames.length > 0">
              Games
              <b-list-group >
                <GameSearchResult
                  v-for="game, index in search.basegames"
                  :game="game"
                  :key="index"
                  @click.native="addGame(game.id)"
                />
              </b-list-group>
            </div>
            <div v-show="search.expansions.length > 0">
              Expansions
              <b-list-group >
                <GameSearchResult
                  v-for="game, index in search.expansions"
                  :game="game"
                  :key="index"
                  @click.native="addGame(game.id)"
                />
              </b-list-group>
            </div>

            <template #modal-footer="{ok}">
              <b-button size="sm" variant="outline-secondary" @click="ok()">
                Done
              </b-button>
            </template>
        </b-modal>

        <b-card title="Filter games">

          <b-form-group
            v-if="settings.showColumns.players"
            label="Number Of Players"
            label-cols>
            <b-form-input
              v-model="filter.numplayers"
              type="number" />
          </b-form-group>

          <b-form-group
            v-if="settings.showColumns.publishyear"
            label="Year Published"
            label-cols>
            <b-input-group>
              <b-form-input
                v-model="filter.publishyear.value"
                type="number" />
              <b-input-group-append is-text>
                <b-form-checkbox
                  v-model="filter.publishyear.olderThan"
                  v-b-tooltip.hover
                  title="Only show games published before this year"
                > Older Than </b-form-checkbox>
              </b-input-group-append>
            </b-input-group>
          </b-form-group>

          <b-form-group
            v-if="settings.showColumns.tags"
            label="Tags"
            label-cols>
            <b-input-group>
              <b-form-tags disabled placeholder="">
                <b-form-tag
                  v-for="tag, index in filter.tags"
                  :key="index"
                  :style="tagStyle(tag.match)"
                  @remove="removeFilterTag(tag)">
                    {{tag.name}}
                </b-form-tag>
              </b-form-tags>
              <b-input-group-append is-text>
                <b-form-checkbox
                  v-model="filter.anyTag"
                  v-b-tooltip.hover
                  title="Show games that match any of these tags. Uncheck to only show games that match all tags."
                > Any </b-form-checkbox>
              </b-input-group-append>
            </b-input-group>
          </b-form-group>

        </b-card>



      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-row>
          <b-col>
            <h1>Available Games</h1>
          </b-col>
          <b-col>
            <div v-if="games.length > 1" >
              <b-button v-if="filter.randomGame == null" @click='randomGame'>Pick A Random Game For Me</b-button>
              <b-button v-else @click='filter.randomGame = null'>See All Games</b-button>
            </div>
          </b-col>
          <b-col>
            <BIconGear @click="showSettingsModal = true" />
          </b-col>
        </b-row>
        <b-table
          id="gamestable"
          title="Available Games"
          sticky-header="100%"
          empty-filtered-text="There are no games to show."
          striped
          show-empty
          :filter="filter"
          :filter-function="filterGames"
          @filtered="onFilter"
          :busy="loadingCollection"
          :fields="displayFields"
          :items="displayGames">

          <template #cell(thumbnail)="data">
            <b-img-lazy :src="data.value" height="80px" alt="thumbnail" />
          </template>

          <template #cell(name)="data">
            <div
              v-b-popover.hover.v-info.topright="data.item.description"
              :title="data.value">
            <a target="_blank" :href="getGameURL(data.item.id)">{{data.value}}</a>
            </div>
          </template>

          <template #cell(rating)="data">
            {{data.value > 0? `${data.value}${settings.showNumVotes.rating? ` (${data.item.ratingVotes})` : ''}` : '-'}}
          </template>

          <template #cell(complexity)="data">
            {{data.value > 0? `${data.value}${settings.showNumVotes.complexity? ` (${data.item.complexityVotes})` : ''}` : '-'}}
          </template>

          <template #cell(players)="data">
            {{data.item.minplayers == data.item.maxplayers ? data.item.minplayers : data.item.minplayers + " - " + data.item.maxplayers }}
          </template>

          <template #cell(playtime)="data">
            {{formatPlaytime(data.item)}}
          </template>

          <template #cell(minage)="data">
            {{data.value > 0? data.value+'y' : '-'}}
          </template>

          <template #cell(publishyear)="data">
            {{data.value > 0? data.value : '-'}}
          </template>

          <template #cell(tags)="data">
            <b-form-tags
              disabled>
                <b-form-tag
                  v-for="tag, index in data.value"
                  :key="index"
                  no-remove
                  :style="tagStyle(tag.match)">
                    <div @click="addFilterTag(tag)">{{tag.name}}</div>
                </b-form-tag>
              </b-form-tags>
          </template>

          <template #cell(description)="row">
            <b-button size="sm" @click="row.toggleDetails" variant="primary">
              {{ row.detailsShowing ? 'Hide' : 'Show' }}
            </b-button>
          </template>

          <template #row-details="row">
            <div style="max-width: 80%">
              {{row.item.description}}
            </div>
          </template>

          <template #table-busy>
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>
              <strong>Loading...</strong>
            </div>
          </template>
        </b-table>
      </b-col>
    </b-row>

    <b-modal v-model="showSettingsModal" title="Settings">
      <b-card title="Show Columns">
        <b-form-group label-cols label="Rank">
          <b-form-checkbox v-model="settings.showColumns.rank" />
        </b-form-group>
        <b-form-group label-cols label="Rating">
          <b-form-checkbox v-model="settings.showColumns.rating" />
        </b-form-group>
        <b-form-group label-cols label="Complexity">
          <b-form-checkbox v-model="settings.showColumns.complexity" />
        </b-form-group>
        <b-form-group label-cols label="# Players">
          <b-form-checkbox v-model="settings.showColumns.players" />
        </b-form-group>
        <b-form-group label-cols label="Play Time">
          <b-form-checkbox v-model="settings.showColumns.playtime" />
        </b-form-group>
        <b-form-group label-cols label="Minimum Age">
          <b-form-checkbox v-model="settings.showColumns.minage" />
        </b-form-group>
        <b-form-group label-cols label="Year Published">
          <b-form-checkbox v-model="settings.showColumns.publishyear" />
        </b-form-group>
        <b-form-group label-cols label="Tags">
          <b-form-checkbox v-model="settings.showColumns.tags" />
        </b-form-group>
        <b-form-group label-cols label="Description">
          <b-form-checkbox v-model="settings.showColumns.description" />
        </b-form-group>
      </b-card>
      <b-card title="Show Vote Count">
        <b-form-group label-cols label="Rating">
          <b-form-checkbox v-model="settings.showNumVotes.rating" />
        </b-form-group>
        <b-form-group label-cols label="Complexity">
          <b-form-checkbox v-model="settings.showNumVotes.complexity" />
        </b-form-group>
      </b-card>
    </b-modal>
  </b-container>
</template>

<script>
import {BIconSearch, BIconPlus, BIconGear} from 'bootstrap-vue'
import GameSearchResult from '~/components/gameSearchResult.vue'
const entities = require("entities")
var parseString = require('xml2js').parseString;
import Vue from 'vue'
import VueCookies from 'vue-cookies'
Vue.use(VueCookies)
Vue.$cookies.config(-1)

export default {
  name: 'App',
  components: {
    BIconSearch,
    BIconPlus,
    BIconGear,
    GameSearchResult
  },
  data () {
    return {
      collapse: true,
      loadingCollection: false,
      username: '',
      usernameValidationState: null,
      search: {
        showModal: false,
        query: '',
        basegames: [],
        expansions: []
      },
      cookies: {
        username: (un) => {this.username = un},
        extragames: this.getExtraGames,
        settings: (settings) => {this.settings = settings}
      },
      showSettingsModal: false,
      settings: {
        showColumns: {
          rank: true,
          rating: true,
          complexity: true,
          players: true,
          playtime: true,
          minage: true,
          publishyear: true,
          tags: true,
          description: true,
        },
        showNumVotes: {
          rating: true,
          complexity: true
        }
      },
      games: [],
      extraGames: [],
      filteredGames: [],
      filter: {
        name: null,
        numplayers: null,
        playtime: null,
        publishyear: {
          oldest: 0,
          value: null,
          olderThan: false
        },
        tags: [],
        anyTag: false,
        randomGame: null
      },
      fields: {
        thumbnail: {
          label: '',
          sortable: false,
        },
        name: {
          label: 'Game',
        },
        rank: {},
        rating: {},
        complexity: {
          label: 'Complexity (out of 5)',
        },
        players: {
          sortable: false,
        },
        playtime: {
          label: 'Play Time',
          sortable: false,
        },
        minage: {
          label: 'Min Age',
        },
        publishyear: {
          label: 'Year Published',
        },
        tags: {},
        description: {}
      },
      tagColors: [
        "#8b3dbf",
        "#3d89bf",
        "#bf3dae",
        "#03d7fc",
        "#3dbf57",
        "#bf533d"
      ]
    }
  },
  computed: {
    displayGames () {
      return this.games.map((game) => {
        game.matchesSome = false
        game.matchesAll = true
        game.tags = game.tags.map((tag) => {
          tag.match = null
          return tag
        })
        for(let i = 0; i < this.filter.tags.length; i++) {
          let matchIdx = game.tags.findIndex((tag) => { return tag.id == this.filter.tags[i].id })
          if (matchIdx >= 0) {
            game.matchesSome = true
            game.tags[matchIdx].match = this.tagColors[i]
          } else {
            game.matchesAll = false
          }
        }
        return game
      })
    },
    displayFields () {
      const result = []
      for (const [key, values] of Object.entries(this.fields)) {
        if(this.settings.showColumns[key] ?? true) {
          result.push({
            key,
            sortable: values.sortable ?? true,
            ...values
          })
        }
      }
      return result
    },
    setCookies () {
      this.$cookies.set("settings", this.settings)
      return this.settings
    }
  },
  watch: {
    // TODO: this doesnt work
    settings: {
      handler: function(fresh) {
        this.$cookies.set("settings", fresh)
      },
      deep: true
    }
  },
  mounted () {
    console.clear()

    this.search.basegames = [
      {
        name: 'Azul',
        year: '2016',
        thumbnail: 'https://cf.geekdo-images.com/RrYR1xB8H7D1B5GwNV8jgQ__thumb/img/vUGmS3mniayuyVOG-1ulrVGnjSg=/fit-in/200x150/filters:strip_icc()/pic4212417.jpg'
       },
      {
        name: 'Codenames',
        year: '2019',
        thumbnail: 'https://cf.geekdo-images.com/F_KDEu0GjdClml8N7c8Imw__thumb/img/yl8iXxSNwguMeg3KkmfFO9SMVVc=/fit-in/200x150/filters:strip_icc()/pic2582929.jpg'
       },
    ]
    this.search.expansions = [
      {
        name: 'Azul',
        year: '2016',
        thumbnail: 'https://cf.geekdo-images.com/RrYR1xB8H7D1B5GwNV8jgQ__thumb/img/vUGmS3mniayuyVOG-1ulrVGnjSg=/fit-in/200x150/filters:strip_icc()/pic4212417.jpg'
       },
      {
        name: 'Codenames',
        year: '2019',
        thumbnail: 'https://cf.geekdo-images.com/F_KDEu0GjdClml8N7c8Imw__thumb/img/yl8iXxSNwguMeg3KkmfFO9SMVVc=/fit-in/200x150/filters:strip_icc()/pic2582929.jpg'
       },
    ]
    this.search.showModal = true

    // Handle url params
    let searchParams = new URLSearchParams(new URL(window.location.href).search)
    for(let [key, value] of searchParams) {
      switch (key) {
        case 'username':
          this.username = value
          this.getCollection()
          break
        case 'games':
          this.extraGames = value.split(',')
          this.getExtraGames()
        default: break
      }
    }

     this.checkForCookies()
    // this.getCollection()
  },
  methods: {
    openGameSearchModal () {
      this.search.showModal = true
      let that = this
      Vue.nextTick(function () {
        that.$refs['search-box'].select()
      })
    },
    filterGames (game, filter) {
      if(filter.randomGame && filter.randomGame !== game.id) return false
      if (filter.numplayers && filter.numplayers > game.maxplayers) return false
      if (filter.numplayers && filter.numplayers < game.minplayers) return false
      if (filter.playtime && filter.playtime > game.maxplaytime) return false
      if (filter.playtime && filter.playtime < game.minplaytime) return false
      if (filter.publishyear.value) {
        if(filter.publishyear.olderThan) {
          if (filter.publishyear.value <= game.publishyear) return false
        }
        else {
          if (filter.publishyear.value >= game.publishyear) return false
        }
       }

      if (filter.tags.length > 0) {
        if(filter.anyTag) {
          if(!game.matchesSome) {
            return false
          }
        } else {
          if(!game.matchesAll) {
            return false
          }
        }
      }
      return true
    },
    onFilter (filteredGames, count) {
      this.filteredGames = filteredGames
    },
    addFilterTag (tag) {
      if(this.filter.tags.length < this.tagColors.length) {
        this.filter.tags.push(tag)
      } else {
        this.doToast('Slow down there', "That's probably enough tags.")
      }
    },
    removeFilterTag (tag) {
      this.filter.tags = this.filter.tags.filter(t => t.id !== tag.id)
    },
    tagStyle (color) {
      let style = {
        cursor: "pointer",
      }
      if(color) style.backgroundColor = color
      return style
    },
    async getCollection () {
      if(this.username?.length <= 0) {
        this.usernameValidationState = false
        return
      }
      this.usernameValidationState = null
      this.$cookies.set("username", this.username)
      this.loadingCollection = true
      let results
      let url = `collection?username=${this.username}&own=1`
      results = await this.tryGet(url, 'Invalid Username', 'That does not appear to be a valid username on BoardGameGeek.com')
      console.log(results)
      if(!results) {
        this.loadingCollection = false
        return
      }
      if(results.message){
        this.doToast('Error from BGG', `Message: ${results.message}`, 'danger')
        this.loadingCollection = false
      }
      if(!(results.items?.item?.length)) {
        this.doToast('No Games', `There does not appear to be any games in this user's collection`, 'info')
        this.loadingCollection = false
        return
      }
      const gameIds = results.items.item.map((game) => {return game.$.objectid})
      const strung = gameIds.join()
      url = `thing?id=${strung}&stats=1`
      results = await this.tryGet(url)
      this.games = this.mapGameObjects(results.items.item)
      this.loadingCollection = false
    },
    getGameURL(game) {
      return "https://boardgamegeek.com/boardgame/" + game
    },

    formatPlaytime (game) {
      let ret = formatHrs(game.minplaytime)
      if ( game.minplaytime != game.maxplaytime ) {
        ret += ' - ' + formatHrs(game.maxplaytime)
      }
      return ret
    },
    async gameSearch(query) {
      if(query.length < 2){
        return
      }
      let url = `search?query=${query}&type=boardgameexpansion,boardgame`
      let parsed = await this.tryGet(url)
      if(!(parsed.items?.item?.length)) return  // No results
      let games = parsed.items.item.filter(game => game.name[0].$.type == "primary") // Filter out translated names
      games = games.map((game) => {
        return {
          id: game.$.id,
          expansion: (game.$.type == "boardgameexpansion"),
          name: game.name[0].$.value,
          year: game.yearpublished?.[0].$.value,
          thumbnail: null
        }
      })
      let expansions = games.filter((x)=>{return x.expansion})
      let basegames = games.filter((x)=>{return !x.expansion})
      // Remove duplicates
      expansions.map((exp)=>{
        let baseIdx = basegames.findIndex((base)=>{return base.id == exp.id})
        if(baseIdx >= 0){
          basegames.splice(baseIdx,1)
        }
      })
      basegames = basegames.sort((a, b)=>{return b.year - a.year})
      expansions = expansions.sort((a, b)=>{return b.year - a.year})
      // Set display lists
      this.search.basegames = basegames
      this.search.expansions = expansions
      // Start fetching base game thumbnails
      let idString = basegames.map(game => game.id).join(',')
      url = `thing?id=${idString}`
      parsed = await this.tryGet(url)
      parsed.items.item.map((res) => {
        this.search.basegames.find(game => game.id == res.$.id).thumbnail = res.thumbnail?.[0]
      })
      // Start fetching expansion thumbnails
      idString = expansions.map(game => game.id).join(',')
      url = `thing?id=${idString}`
      parsed = await this.tryGet(url)
      parsed.items.item.map((res) => {
        this.search.expansions.find(game => game.id == res.$.id).thumbnail = res.thumbnail?.[0]
      })
    },
    randomGame () {
      this.filter.randomGame = this.filteredGames[Math.floor(Math.random() * this.filteredGames.length)].id
    },
    async getExtraGames() {


    },
    async addGame(id) {
      if( this.games.some((game) => { return game.id == id}) ) {
        this.doToast('Hey', 'That game is already in the list.', 'info')
        return
      }
      const url = `thing?id=${id}&stats=1`
      const parsed = await this.tryGet(url)
      const newGame = this.mapGameObjects(parsed.items.item)
      this.games.push(...newGame)
      this.doToast('Game Added', `${newGame[0].name} was added to the list`, 'success')
      this.searchTerm = ''
      this.$refs['search-box'].select()
      this.search.basegames = []
      this.search.expansions = []
    },
    mapGameObjects(uglyGames) {
      return uglyGames.map((game) => {
        const tags = game.link.filter((link) => {
          return link.$.type == "boardgamecategory" || link.$.type == "boardgamemechanic"
        })
        .map((link)=>{
          return {
            id: link.$.id,
            name: link.$.value,
            match: false
          }
        })
        return {
          id: game.$.id,
          thumbnail: game.thumbnail[0],
          name: game.name[0].$.value,
          complexity: parseFloat(game.statistics[0].ratings[0].averageweight[0].$.value).toFixed(2),
          complexityVotes: game.statistics[0].ratings[0].numweights[0].$.value,
          rating: parseFloat(game.statistics[0].ratings[0].average[0].$.value).toFixed(1),
          ratingVotes: game.statistics[0].ratings[0].usersrated[0].$.value,
          rank: game.statistics[0].ratings[0].ranks[0].rank[0].$.value,
          minplayers: game.minplayers[0].$.value,
          maxplayers: game.maxplayers[0].$.value,
          minplaytime: game.minplaytime[0].$.value,
          maxplaytime: game.maxplaytime[0].$.value,
          minage: game.minage[0].$.value,
          publishyear: game.yearpublished[0].$.value,
          description: entities.decodeHTML(game.description[0]),
          tags
        }
      })
    },
    checkForCookies() {
      Object.entries(this.cookies).map((cookie) => {
        const result = this.$cookies.get(cookie[0])
        if(result) {
          cookie[1](result)
        }
      })
    },
    async tryGet (url, errTitle = "Error", errMsg = "Oops. Something went wrong") {
      try {
        const results = await this.$axios.get(url)
        let parsed
        parseString(results.data, function (err, res) {
          if(err) {
            throw 'xml2jsParseException'
          }
          parsed = res
        })
        return parsed
      } catch (error) {
        console.error('tryGet: ', error)
        this.doToast(errMsg, errTitle, 'danger')
        return null
      }
    },
    doToast(title, message, variant) {
      this.$bvToast.toast(message, {
        title,
        variant
      })
    }
  }
}

const formatHrs = (minutes) => {
  let hours = Math.floor(minutes / 60)
  if(hours) {
    hours += Math.round((minutes % 60) / 15) * 0.25
    return hours + 'hr'
  } else {
    return minutes + 'm'
  }
}
</script>

<style scoped>
  .add-game-plus-icon {
    padding: -10px;
    color: aqua;
  }
</style>
