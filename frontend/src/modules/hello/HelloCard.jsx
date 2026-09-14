import { useEffect, useState } from "react";

function HelloCard() {
    const [message, setMessage] = useState("Loading...");

    useEffect(() => {
        fetch("/api/hello")
            .then((r) => r.json())
            .then((data) => setMessage(data.message))
            .catch(() => setMessage("Failed to reach backend"));
    }, []);

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Hello Module</h2>
            <p className="mt-1 text-lg text-gray-900 dark:text-gray-100">{message}</p>
        </div>
    );
}

export default HelloCard;
