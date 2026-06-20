import { ref, watch } from '../core'

const WatchTestCom = {
    template: `
    <div>
        <p>
            Ask a yes/no question:
            <input v-model="question" :disabled="loading" />
        </p>
        <p>{{ answer }}</p>
    </div>
  `,
    setup() {
        const question = ref('')
        const answer = ref('Questions usually contain a question mark. ;-)')
        const loading = ref(false)

        // 可以直接侦听一个 ref
        watch(question, async (newQuestion, oldQuestion) => {
            if (newQuestion.includes('?')) {
                loading.value = true
                answer.value = 'Thinking...'
                try {
                    const res = await fetch('https://yesno.wtf/api')
                    answer.value = (await res.json()).answer
                } catch (error) {
                    answer.value = 'Error! Could not reach the API. ' + error
                } finally {
                    loading.value = false
                }
            }
        })
        return { question, answer, loading }
    }
}
export default WatchTestCom