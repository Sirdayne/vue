// TODO !

/* replace setInterval to setTimeout
 * and decrease time limit if app went offline
 */
export default {
  data() {
    return {
      isUnlogined: false,
      isOffline: false,
      pingIntervalId: null,
      interval: 1000 * 60,
    }
  },
  created() {
    this.startPing()
    this.$router.beforeEach((to, from, next) => {
      this.startPing()
      next()
    })
  },
  destroyed() {
    clearInterval(this.pingIntervalId)
  },
  methods: {
    startPing() {
      clearInterval(this.pingIntervalId)
      if (this.$auth.authenticated) {
        this.pingIntervalId = setInterval(() => {
          this.$root.pingAction()
        }, this.interval)
      }
    }
  }
}
