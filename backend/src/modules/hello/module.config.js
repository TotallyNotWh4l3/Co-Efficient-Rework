const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({ message: "Hello from the backend module registry" });
});

module.exports = {
    name: "hello",
    routes: {
        basePath: "/api/hello",
        router,
    },
};
