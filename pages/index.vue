<template>
  <b-container fluid id="app">
    <b-row>
      <b-col cols="6">
        <b-form-group
          label-cols
          label="Load from BGG Collection">
          <b-input-group>
            <b-form-input
              id="input-username"
              v-model="username"
              v-on:keyup.enter="getCollection"
              :state="usernameValidationState"
              type="search" />
            <b-input-group-append is-text style="cursor:pointer" @click="getCollection">
                <BIconSearch/>
            </b-input-group-append>
          </b-input-group>
          <b-button
            v-if="collectionGames.length > 0"
            @click="collectionGames = []">
            Clear Games
          </b-button>
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
                  @click.native="handleClickonSearchedGame(game.id)"
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
                  @click.native="handleClickonSearchedGame(game.id)"
                />
              </b-list-group>
            </div>

            <template #modal-footer="{ok}">
              <b-button size="sm" variant="outline-secondary" @click="ok()">
                Done
              </b-button>
            </template>
        </b-modal>

        <b-form-group
            v-if="extraGames.length"
            label="Extra Games"
            label-cols>
            <b-input-group>
              <b-form-tags disabled placeholder="">
                <b-form-tag
                  v-for="game, index in extraGames"
                  :key="index"
                  @remove="removeExtraGame(game.id)">
                    {{game.name}}
                </b-form-tag>
                <b-form-tag
                  v-if="extraGames.length > 1"
                  no-remove
                  variant="danger"
                  @click.native="clearAllExtraGames()">
                  clear
                </b-form-tag>
              </b-form-tags>
            </b-input-group>
          </b-form-group>

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
    <hr>
    <b-row>
      <b-col>
        <b-row>
          <b-col>
            <h3>{{filteredGames.length}} Games to choose from:</h3>
          </b-col>
          <b-col>
            <div v-if="displayGames.length > 1" >
              <b-button v-if="filter.randomGame == null" @click='randomGame'>Pick A Random Game For Me</b-button>
              <b-button v-else @click='filter.randomGame = null'>See All Games</b-button>
            </div>
          </b-col>
          <b-col>
            <BIconGear @click="showSettingsModal = true" />
            <BIconShare
              v-b-tooltip.hover
              title="Copy Permalink"
              @click="copyPermalink()" />
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
            <b-img-lazy :src="data.value" height="80px"/>
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
    <v-tour name="myTour" :steps="steps" />
  </b-container>
</template>

<script>
import {BIconSearch, BIconPlus, BIconGear, BIconShare} from 'bootstrap-vue'
import GameSearchResult from '~/components/gameSearchResult.vue'
import VueTour from 'vue-tour'
Vue.use(VueTour)
const entities = require("entities")
var parseString = require('xml2js').parseString;
import Vue from 'vue'

export default {
  name: 'App',
  components: {
    BIconSearch,
    BIconPlus,
    BIconGear,
    BIconShare,
    GameSearchResult
  },
  data () {
    return {
      steps: [
        {
          target: '#input-username',
          header: {
            title: 'test step',
          },
          content: 'test step.'
        }
      ],
      loadingCollection: false,
      username: '',
      usernameValidationState: null,
      search: {
        showModal: false,
        query: '',
        basegames: [],
        expansions: []
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
      collectionGames: [],
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
      let allGames = this.collectionGames.concat(this.extraGames)
      return allGames.map((game) => {
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
    }
  },
  watch: {
    settings: {
      handler: function(settings) {
        const parsed = JSON.stringify(settings)
        localStorage.setItem('settings', parsed)
      },
      deep: true
    },
    filter: {
      handler: function(filter) {
        const parsed = JSON.stringify(filter)
        localStorage.setItem('filter', parsed)
      },
      deep: true
    },
    extraGames: function(games) {
        const ids = games.map(game => game.id)
        const parsed = JSON.stringify(ids)
        localStorage.setItem('extragames', parsed)
      },
      deep: true
  },
  mounted () {
    console.clear()
    // this.$tours['myTour'].start()

    // Check for url params
    // let searchParams = new URLSearchParams(window.location.search)
    const urlSearchParams = new URLSearchParams(window.location.search)
    const params = Object.fromEntries(urlSearchParams.entries())
    console.log(params)
    if(Object.keys(params).length) {
      for(const [key, value] of Object.entries(params)) {
        switch (key) {
          case 'username':
            this.username = value
            this.getCollection()
            break
          case 'games':
            this.getExtraGames(value.split(','))
            break
          case 'filterName':
            this.filter.name = value
            break
          case 'filterNumPlayers':
            this.filter.numplayers = value
            break
          case 'filterPlayTime':
            this.filter.playtime = value
            break
          case 'filterYear':
            this.filter.publishyear.value = value
            break
          case 'filterOlder':
            this.filter.publishyear.olderThan = value
            break
          case 'filterTags':
            // Do this later, it's complicated
            // this.setFilterTagsFromURL(value.split(',',this.tagColors.length))
            break
          case 'filterAnyTag':
            this.filter.anyTag = value
            break
          default: break
        }
      }
    }
    // If there were no URL params, check local storage
    else {
      if (localStorage.getItem('extragames')) {
        try {
          const extraGames = JSON.parse(localStorage.getItem('extragames'))
          this.getExtraGames(extraGames)
        } catch(e) {
          localStorage.removeItem('extragames')
        }
      }
      if (localStorage.getItem('filter')) {
        try {
          this.filter = JSON.parse(localStorage.getItem('filter'))
        } catch(e) {
          localStorage.removeItem('filter')
        }
      }
      if (localStorage.username) {
        this.username = localStorage.username
        this.getCollection()
      }
    }
    // Either way, get settings from localStorage
    if (localStorage.getItem('settings')) {
      try {
        this.settings = JSON.parse(localStorage.getItem('settings'))
      } catch(e) {
        localStorage.removeItem('settings')
      }
    }
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
    setFilterTagsFromURL (tags) {

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
      localStorage.username = this.username
      this.loadingCollection = true
      let results
      let url = `collection?username=${this.username}&own=1`
      results = await this.tryGet(url, 'Invalid Username', 'That does not appear to be a valid username on BoardGameGeek.com')
      if(!results) { // tryGet returned null, probably because cross-origin error, which appears to be that the username didn't exist
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
      if(!results) {
        this.loadingCollection = false
        return
      }
      this.collectionGames = this.mapGameObjects(results.items.item)
      this.doToast('Games added', `Successfully added ${gameIds.length} games from ${this.username}'s collection of owned games.`, 'success')
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
        let foundGame = this.search.basegames.find(game => game.id == res.$.id)
        if(foundGame) {
          foundGame.thumbnail = res.thumbnail?.[0]
        }
      })
      // Start fetching expansion thumbnails
      idString = expansions.map(game => game.id).join(',')
      url = `thing?id=${idString}`
      parsed = await this.tryGet(url)
      parsed.items.item.map((res) => {
        let foundGame = this.search.expansions.find(game => game.id == res.$.id)
        if(foundGame) {
          foundGame.thumbnail = res.thumbnail?.[0]
        }
      })
    },
    randomGame () {
      this.filter.randomGame = this.filteredGames[Math.floor(Math.random() * this.filteredGames.length)].id
    },
    clearAllExtraGames () {
      this.extraGames = []
    },
    removeExtraGame (id) {
      const foundGame = this.extraGames.findIndex(game => game.id == id)
      if(foundGame >= 0) {
        this.extraGames.splice(foundGame, 1)
      } else {
        console.error('could not find game to remove', id)
      }
    },
    async getExtraGames(gameIds) {
      for(let id of gameIds) {
        const url = `thing?id=${id}&stats=1`
        const parsed = await this.tryGet(url)
        if(parsed.items.item) {
          const newGame = this.mapGameObjects(parsed.items.item)
          this.extraGames.push(...newGame)
          this.doToast('Game Added', `${newGame[0].name} was added to the list`, 'success')
        } else {
          this.doToast('Oops', 'Failed to add game ID: ' + id, 'danger')
        }
      }
    },
    async handleClickonSearchedGame(id) {
      if( this.displayGames.some((game) => { return game.id == id}) ) {
        this.doToast('Hey', 'That game is already in the list.', 'info')
        return
      }
      this.getExtraGames([id])
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
          thumbnail: game.thumbnail?.[0],
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
    doToast(title, message, variant = 'info') {
      this.$bvToast.toast(message, {
        title,
        variant
      })
    },
    copyPermalink () {
      try {
        if (!navigator.clipboard) throw "oops"

        const encodeParams = {
          'username': this.username,
          'games': this.extraGames.length ? this.extraGames.map(game => game.id).join() : null,
          'filterName': this.filter.name,
          'filterNumPlayers': this.filter.numplayers,
          'filterPlayTime': this.filter.playtime,
          'filterYear': this.filter.publishyear.value,
          'filterOlder': this.filter.publishyear.olderThan,
          'filterAnyTag': this.filter.anyTag,
        }


        console.log(this.extraGames)
        console.log(encodeParams)

        let text = window.location + '?'
        let and = false
        for(const [key, value] of Object.entries(encodeParams)) {
          if(value) {
            text += (and ? '&' : '') + `${key}=${value}`
            and = true
          }
        }
        console.log(text)
        navigator.clipboard.writeText(text).then(() => {
          this.doToast('Success', 'Permalink copied to clipboard', 'success')
        }, (err) => {
          throw "oops"
        })
      } catch (error) {
        this.doToast('Copy Failed.', 'Your browser does not support this operation.', 'danger')
      }
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
