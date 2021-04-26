const app = Vue.createApp({
    data() {
        return {
            alias: '',
            url: '',
            res: {},
        }
    },
    methods: {
        async createShort() {
            const res = await fetch('/', {
                method: 'POST',
                headers:{
                    "content-type":"application/json",
                },
                body: JSON.stringify({
                    url: this.url,
                    alias: this.alias,
                }),
            })
            this.res=  await res.json()
            console.log(this.res)
        }
    }
})

app.mount('#app')