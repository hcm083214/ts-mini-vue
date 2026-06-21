const CardItem = {
  template: `
    <div class="card">
        <div class="card-body">
            <h5 class="card-title">{{ title }}</h5>
            <button @click="handleEnlargeText">Enlarge Text</button>
        </div>
    </div>
    `,
    props: ['title'],
    emits: ['enlarge-text'],
    
  setup(props: { title: string }, ctx: { emit: (event: 'enlarge-text', value: number) => void }) {
    console.log(props.title)
    const handleEnlargeText = () => {
        console.log('CardItem enlarge text!');
        ctx.emit('enlarge-text', 5);
    }
    return { title: props.title, handleEnlargeText };
  }
}
export default CardItem;