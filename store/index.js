import axios from 'axios'
import Vue from 'vue'
import Vuex from 'vuex'

export default () => new Vuex.Store({
  state () {
    return {
    }
  },
  mutations: {
    setLists (state, payload) {
    },
  },
  actions: {
    async newSibling (context, payload) {
      const parent = context.state.items[payload.parent]
    },
    deleteItem ({ commit }, payload) {
      const url = '/api/app/deleteItem/' + payload.id
      axios.delete(url)
      commit('deleteItem', payload)
    }
  }
})
