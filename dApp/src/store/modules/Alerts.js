
export default {
    namespaced: true,

    state: () => ({
        alerts: []
    }),

    mutations: {
        ADD_ALERT: (state, payload) => {
            state.alerts.push(payload);
        },

        ADD_ERROR_ALERT: (state, payload) => {
            const alert = {
                autoDismiss: 5,
                text: payload,
                type: "danger"
            }
            state.alerts.push(alert);
        },
    },
}
