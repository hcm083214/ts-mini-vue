import CardItem from './CardItem';
import { ref } from '../core'
const Card = {
    template: `
    <div class="card">
        <h2>Card Component</h2>
        <CardItem v-for="post in posts"
            :key="post.id"
            :title="post.title"
        ></CardItem>
        <CardItem title="My journey with Vue1" @enlarge-text="handleEnlargeText"></CardItem>
    </div>
    `,
    components: { CardItem },
    setup() {
        const posts = ref([
            { id: 1, title: 'My journey with Vue' },
            { id: 2, title: 'Blogging with Vue' },
            { id: 3, title: 'Why Vue is so fun' }
        ])
        const handleEnlargeText = (fontSize: number) => {
            console.log('Card enlarge text!', fontSize);
        }
        return { posts, handleEnlargeText };
    }
}
export default Card;