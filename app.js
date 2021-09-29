const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const { API_VERSION } = require("./config");


app.use(express.json());
app.use(express.urlencoded());
// Load routings
const whatsappRoutes = require("./routers/whatsapp");

// Configure Header HTTP
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method"
    );
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
    next();
});

// Router Basic
app.use(`/api/${API_VERSION}`, whatsappRoutes);

process.on('unhandledRejection', err => {
    console.log(err)
});

module.exports = app;
