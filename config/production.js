const mongoose = require("mongoose");

const config = {
    url: "https://tdlist.herokuapp.com",
    // mongodb connection setting
    database: {
        connect: function (db) {
            mongoose.connect(process.env.DB_URI + db).then(connect => console.log("Connected to mongodb...")).catch(e => console.log("Could not connect to mongodb", e));
        }
    },
    // server details
    server: {
        host: "heroku"
    }
}

module.exports = config;