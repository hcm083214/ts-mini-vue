const App = {
    template: `
    <div class="container">
        <h1>Hello App!</h1>
        <p><strong>Current route path:</strong> {{ $route.fullPath }}</p>
        <nav>
            <RouterLink to="/">Go to Home</RouterLink>
            <RouterLink to="/watch">Go to Watch</RouterLink>
        </nav>
        <main>
            <RouterView />
        </main>
    </div>
    `
}
export default App