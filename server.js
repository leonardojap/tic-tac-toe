//Dependecies
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http); // socket connection

//app.use(require('express').static(__dirname + '/views'))

app.get("/", (req, res)=>{
    res.sendFile(__dirname+"/index.html");
});

app.get("/youWin", (req, res)=>{
    res.sendFile(__dirname+"/winner.html");
});

app.get("/tryAgain", (req, res)=>{
    res.sendFile(__dirname+"/loser.html");
});

app.get("/default", (req, res)=>{
    res.sendFile(__dirname+"/winByDefault.html");
});

//list of users
var users = new Game("","");

//the board of the game

var game = [[".",".","."],[".",".","."],[".",".","."]];

var turn = "";

tied = 0;

win = false;

//make socket connection user
io.on('connection',(socket)=>{
    
    var name = getName();
    if(name != "".trim()){
        //send message only to user connected
        io.to(socket.id).emit("start connection", "connected to 127.0.0.1 5050");
        var user = new User(socket.id, name);
        //if there isn't a seccond player.
        if(user.name === "First player"){
            users.firstUser = user;        
        }else if(user.name === "Second player"){
            users.secondUser = user;
            //send message 'Game startded to each user with different message'
            io.to(users.firstUser.id).emit("start game", "Game started. You are the "+users.firstUser.name, users.firstUser.name);
            io.to(users.firstUser.id).emit("message", "Make your firt move, do click in any item", users.firstUser.name);
            io.to(socket.id).emit("start game", "Game started. You are the "+user.name, name);
            io.to(socket.id).emit("message", "Wait for the movement of the First player", name);
            turn = users.firstUser.name;
            //print board
            io.emit("start connection",getBoard());
        }

        //get movemens from users
        socket.on("user set move", (move, id)=>{
            if(move != "r"){
                if(id == turn){
                    if(setPosition(move, id)){
                        tied += 1;
                        setTurn(id);
                        var win = getWinner();
                        if(win != "".trim()){
                            io.emit("play", getBoard(), "Game won by: "+win);
                            io.emit("win", "Game won by: "+win,wim);
                            resetGame();
                        }else{
                            if(tied < 9){
                                io.emit("play", getBoard(), "Now is turn for "+turn);
                            }else{
                                io.emit("win", "The game is tied", "");
                                resetGame();
                            }
                        }
                    }else{
                        io.to(getIdUser(id)).emit("message", "You can not set on position "+move+" because has been player before", "");
                    }                        
                }else{
                    //send message
                    io.to(getIdUser(user)).emit("message", "Please, wait your turn", "");
                }
            }else{
                io.emit("windefault", "The: "+id+" has surrendered \n "+getOtherPlayer(id)+" won the game");
                resetGame();
            }
        });
        //if any player left the game
        socket.on('disconnect', ()=>{
            io.emit("windefault", "The "+name+" is leave the game, you win... congratulations!");
            resetGame();
        });
    }else{
        console.log("There isn't a game to play now,try with a differen port");
    }

});

function getName(){
    var name = "";
    if(users.firstUser == "".trim()){
        name = "First player";
    }else if(users.secondUser == "".trim()){
        name = "Second player";
    }
    return name;
}

//models
function Game(firstUser, secondUser){
    this.firstUser = firstUser;
    this.secondUser = secondUser;
}

function User(id, name){
    this.id = id;
    this.name = name;
}

function getBoard(){
    return game;
}

function setPosition(position, user){
    var set = false;
    var cont = 0;
    for(var i = 0; i < game.length; i++){
        for(j = 0; j < game[i].length; j++){
            cont += 1;
            if(cont == position){
                if(game[i][j] != "."){
                    set = false;
                }else{
                    set = true;
                    if(user == "First player"){
                        game[i][j] = "X";
                    }else{
                        game[i][j] = "O";
                    }
                }
            }
        }
    }
    return set;
}


function resetGame(){
    game = [[".",".","."],[".",".","."],[".",".","."]];
    users = new Game("","");
    turn = "";
    tied = "";
    
}

function getWinner(){
    var userWin = "";
    //vertical
    if(game[0][0] == game[0][1] && game[0][0] == game[0][2] && game[0][1] != "."){
        userWin = game[0][0];
    }else if(game[0][0] == game[1][0] && game[0][0] == game[2][0] && game[1][0] != "."){    //Horizontal
        userWin = game[0][0];
    }if(game[0][0] == game[1][1] && game[0][0] == game[2][2] && game[1][1] != "."){//slashes
        userWin = game[1][1];
    }else if(game[0][2] == game[1][1] && game[0][2] == game[2][0] && game[1][1] != "."){
        userWin = game[1][1];
    }
    //checking the winner..
    if(userWin != ""){
        if(userWin == "X"){
            userWin = "First player";
        }else{
            userWin = "Second player";
        }
    }
    return userWin;
}

function setTurn(user){
    if(user == "First player"){
        turn = "Second player";
    }else{
        turn = "First player";
    }
}

function getIdUser(user){
    var id = "";
    if(user == "First player"){
        id = users.firstUser.id;
    }else{
        id = users.secondUser.id;
    }
    return id;
}

function getOtherPlayer(user){
    var player = ";"
    if(user == "First player"){
        player = users.secondUser.name;
    }else{
        player = users.firstUser.name;
    }
    return player;
}


//serve our application
http.listen(3000, ()=>{
    console.log("app listen on port 3000");
});