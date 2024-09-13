import express from "express"
// import http from "http"
// import SocketIO from "socket.io"

const app = express();
function handleListen(){
    console.log(`the server is listening on 3000`);
}
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res)=>{res.render("home")});
app.get("/*", (_, res)=>{res.redirect("/")});


// function socketDisconnected(){console.log("client 연결 끊김");}

app.listen(3000, handleListen);



