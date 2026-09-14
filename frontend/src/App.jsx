import { loadModules } from "./moduleRegistry";

function App() {
    const modules = loadModules();

    return (
        <div className="p-4">
            <h1 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                CoEfficient
            </h1>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {modules
                    .filter(({ config }) => config.dashboardCard)
                    .map(({ name, config }) => {
                        const Card = config.dashboardCard;
                        return <Card key={name} />;
                    })}
            </div>
        </div>
    );
}

export default App;
