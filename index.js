"use strict";

require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.NODE_PORT;
const routes = require("./routes");

app.set("port", port);
app.use(express.json());
app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(app.get("port"), () => {
  console.log("Server is running on ", app.get("port"));
});
