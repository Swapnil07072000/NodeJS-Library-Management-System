const express = require('express');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const path = require('path');
const sessions = require('express-session');
const cookie = require('cookie-parser')
const cookieParser = require('cookie-parser');
const http=require('http');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { data } = require('jquery');
const port = process.env.port || 3000;

const titleName = "Library Management System";
const books = [
]
const booksIssued = [

]
var bookFine = 200;

var url = "http://localhost:3000/"

const app = express();
dotenv.config();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))
const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: 'secretkey',
    saveUninitialized: true,
    cookie: {maxAge: oneDay},
    resave: false,
}));
app.use(cookieParser());
app.use(function(req, res, next){
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
})
let server = http.createServer(app);
var io=socketIO(server);
var session;
JWT_SECRET_KEY = "GFGSectreKey";
TOKEN_HEADER_KEY = "GFGTokenHeaderKey";


const user_credentials = [
    {
        username: "swapnil",
        password: "Swapnil@07"
    },
    {
        username: "swapnil1",
        password: "Swapnil@0707"
    }
]

const admin_credentials = [
    {
        username: "admin",
        password: "admin"
    }
]

/* Get Method */
app.get("/", (req, res) => {
    
    session = req.session;
    if(session.userid){
        app.get('/');
    }else{
        res.render("user/login")
    }
    
})

app.get("/admin", (req, res) => {
    session = req.session;
    if(session.adminid){
        app.get('/admin_dashboard');
    }else{
        res.render("admin/admin_login")
    }
})


io.sockets.on("connection", async(socket) => {
    socket.join("room1");
    socket.on("load", function(){
        io.sockets.to("room1").emit("tabledata", {
            data: books
        })
    })

    /* Emit */

    socket.on("/api/add", (data) => {
        var  addBook = data.data;
        var found = false;
        books.forEach(book =>{
            if((book.bookName == addBook[0].bookName) && (book.bookState != "Removed")){
                found = true;
            }
        })
        var status;
        if(found){
            status = 409;
            data = [
                {
                    "status": status,
                }
            ]
        }else{
            status = 200;
            for(var i in addBook){
                books.push({
                    "bookName": addBook[i].bookName,
                    "bookAuthor": addBook[i].bookAuthor,
                    "bookPages": addBook[i].bookPages,
                    "bookPrice": addBook[i].bookPrice,
                    "bookState": "Available"
                })
            }
            data = [
                {
                    "status": status,
                    "length": books.length,
                }
            ]        
        }
        socket.emit("/api/add",{
            data: data, 
        }) //409 - Code already present
    })

    socket.on("/api/issue", (data) => {
        var issue = data.data;
        var found = true;
        books.forEach(book =>{
            if(book.bookName == issue[0].bookName && book.bookState != "Issued"){
                book.bookState = "Issued";
                booksIssued.push({
                    "bookName": issue[0].bookName,
                    "issuedTo": issue[0].issuedTo,
                    "issuedDate": issue[0].issuedDate,
                    "bookDueDate": issue[0].bookDueDay,
                    "bookReturnDate": '',
                    "fineCollected": '',
                    "fineAmount": '',
                });
                found = false;
            }
        })
        var status;
        if(found){
            status = 500;
        }else{
            status = 200;        
        }
        data = [
            {
                "status": status,
            }
        ]
        socket.emit("/api/issue",{
            data: data, 
        })
    })

    socket.on("/api/issueInfo", (data) => {
        var data = getInfo(data)
        socket.emit("/api/issuedInfo",{
            data: data,
        })
    })

    socket.on("/api/return", (data) => {
        var returnB = data.data;
        var found = true;
        books.forEach(book =>{
            if(book.bookName == returnB[0].bookName && book.bookState != "Available"){
                book.bookState = "Available";
                found = false;
            }
        })
        booksIssued.forEach(book => {
            if(book.bookName == returnB[0].bookName && book.bookState != "Available"){
                book.bookReturnDate = returnB[0].returnDate;
                book.fineCollected = returnB[0].fineCollected;
                if(returnB[0].fineCollected) book.fineAmount = bookFine;
                else book.fineAmount = 0;
            }
        })
        var status;
        if(found){
            status = 500;
        }else{
            status = 200;        
        }
        data = [
            {
                "status": status,
            }
        ]
        socket.emit("/api/return",{
            data: data, 
        })
    })

    socket.on("disconnect", ()=> {
        socket.disconnect();
    })

    socket.on("/api/returnInfo", (data) => {
        var data = getInfo(data);
        socket.emit("/api/returnInfo",{
            data: data,
        })
    })

    socket.on("/api/edit", (data) => {
        var data = editInfo(data);
        socket.emit("/api/edit", {
            data: data,
        })
    })

    socket.on("/api/delete", (data) => {
        var deleteInfo = data.data
        var deleted = false;
        books.forEach(book => {
            if((book.bookName == deleteInfo[0].bookName) && (book.bookState == "Available")){
                book.bookState = "Removed"
                deleted = true
            }
        })
        var status;
        if(deleted) status = 200
        else status = 500
        var data = [
            {
                "status": status
            }
        ]
        socket.emit("/api/delete",{
            data: data,
        })
    })
    
    /* End */
})

function editInfo(data){
    var newInfo = data.data;
    var edited = false;
    books.forEach(book => {
        if(book.bookName == newInfo[0].oldBookName){
            book.bookName = newInfo[0].bookName
            book.bookAuthor = newInfo[0].bookAuthor
            book.bookPages = newInfo[0].bookPages
            book.bookPrice = newInfo[0].bookPrice
            edited = true
        }
    })
    var status;
    if(edited){
        status = 200
    }else{
        status = 500
    }
    data = [
        {
            "status": status,
        }
    ]
    return data;
}

function getInfo(data){
        var issuedInfo = data.data
        var issuedName, issuedDate, dueDate
        var found = false
        booksIssued.forEach(book => {
            if(book.bookName == issuedInfo[0].bookName){
                issuedName = book.issuedTo
                issuedDate = book.issuedDate
                dueDate = book.bookDueDate
                //console.log(book.issuedTo)
                found = true
            }
        })
        var status
        var data
        if(found){
            status = 200
            data = [
                {
                    "status": status,
                    "issuedName": issuedName,
                    "issuedDate": issuedDate,
                    "bookDueDate": dueDate,
                }
            ]

        }else{
            status = 500
            data = [
                {
                    "status": status,
                }
            ]
        }
        return data;
}

app.get("/redirect", (req, res) => {
    res.redirect(url);
})

app.get("/dashboard", (req, res) => {
    
    if(req.session.userid){
        res.render("user/index", {
            title: titleName,
            data: books,
        })
    }else{
        res.redirect(url)
    }
})

app.get("/admin_dashboard", (req, res) => {
    if(req.session.adminid){
        res.render("admin/admin_index", {
            title: titleName,
            data: books,
        })
    }else{
        res.redirect(url)
    }
})

/* End */

/* Post Method */
let pagename;
app.post("/pageName", (req, res) => {
    if(req.session.adminid || req.session.userid){
        pagename = req.body.page;
        res.send({status: 200})
    }else{
        res.redirect(url)
    }
})


app.post("/load_page", (req, res) => {
    res.redirect(url+pagename);
})
app.post("/admin_load_page", (req, res) => {
    res.redirect(url+pagename);
})

app.post("/api/userlogin", (req, res) => {
    let name = req.body.name;
    let pwd = req.body.pwd;
    let found = false;

    user_credentials.forEach(data => {
        if((data.username == name) && (data.password == pwd)){
            found = true;
        }
    })

    if(found){
        session = req.session;
        session.userid = name;
        res.send({status: 200})
    }else{
        res.send({status: 404})
    }
})

app.post("/api/adminlogin", (req, res) => {
    let name = req.body.name;
    let pwd = req.body.pwd;
    let found = false;

    admin_credentials.forEach(data => {
        if((data.username == name) && (data.password == pwd)){
            found = true;
        }
    })

    if(found){
        session = req.session;
        session.adminid = name;
        res.send({status: 200})
    }else{
        res.send({status: 404})
    }
})



app.post("/api/userlogout", (req, res) => {
    delete req.session.userid;
    //req.session.destroy();
    res.send({url: url});
})


app.post("/api/adminlogout", (req, res) => {
    delete req.session.adminid;
    res.send({url: url});
})

/* End */

/* Post Method */
app.post("/api/add", (req, res) => {
    var found = false;
    const inputBookName = req.body.name
    const inputBookAuthor = req.body.author
    const inputBookPages = req.body.pages
    const inputBookPrice = req.body.price
  
    
})

app.post('/api/issue', (req, res) => {
    var bookName = req.body.bookName;
    
})

app.post('/api/return', (req, res) => {
    var bookName = req.body.bookName;
    var found = false;
    books.forEach(book =>{
        if(book.bookName == bookName && book.bookState != "Available"){
            book.bookState = "Available";
            found = true;
        }
    })
    if(found){
        res.send({status: 200});
    }else{
        res.send({status: 500});
    }
})

app.post('/api/delete', (req, res) => {
    var bookName = req.body.bookName;
    var found = false;
    var j = 0;
    books.forEach(book =>{
        j = j + 1;
        if(book.bookName == bookName && book.bookState != "Issued"){
            books.splice((j-1), 1)
            found = true;
        }
    })
    if(found){
        res.send({status: 200});
    }else{
        res.send({status: 500});
    }
})
/* End */

server.listen(port, (req, res) => {
    console.log("App is running on port 3000")
})