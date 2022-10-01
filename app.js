const express = require('express');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const http = require('http');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
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
app.use(express.static(path.join(__dirname , "public")));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(cookieParser());
app.use(function(req, res, next){
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
})
let server = http.createServer(app);
var io = socketIO(server);
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

/* Middleware */ 
const authorization = (req, res, next) => {
    const token = req.cookies.access_token
    if(token){
        let jwtSecretKey = JWT_SECRET_KEY;
        var verified
        try{
            verified = jwt.verify(token, jwtSecretKey);
        }catch{
            res.redirect(url)
        }
        if(verified){
            return next();
        }else{
            res.redirect(url)    
        }
    }else{
        res.redirect(url)
    }
}

const adminAuthorization = (req, res, next) => {
    const token = req.cookies.admin_token
    if(token){
        let jwtSecretKey = JWT_SECRET_KEY;
        var verified
        try{
            verified = jwt.verify(token, jwtSecretKey);
        }catch{
            res.redirect(url)
        }
        if(verified){
            return next();
        }else{
            res.redirect(url)    
        }
    }else{
        res.redirect(url)
    }
}

/* End */


/* Get Method */
app.get("/", (req, res) => {
    res.render("user/login")
})

app.get("/admin", (req, res) => {
    res.render("admin/admin_login")
})

let pagename 
let adminpagename;
app.post("/pageName", (req, res) => {
    pagename = req.body.page;
    res.send({status: 200})
})
app.post("/load_page", (req, res) => {
    if(pagename) res.redirect(url+pagename);
    else res.redirect(url);
})

app.post("/adminPageName", (req, res) => {
    adminpagename = req.body.page;
    res.send({status: 200})
})
app.post("/admin_load_page", (req, res) => {
    if(adminpagename) res.redirect(url+adminpagename);
    else res.redirect(url);
})

/* User */
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
        let jwtSecretKey = JWT_SECRET_KEY;
        let data = {
            username: name,
            password: pwd,
            time: Date(),
        }
        const token = jwt.sign(data, jwtSecretKey,{
            expiresIn: '1d',
        });
        res.cookie("access_token", token);
        res.send({status: 200})
    }else{
        res.redirect(url);
    }
})

app.post("/api/userlogout", (req, res) => {
    res.clearCookie("access_token")
    .status(200)
    res.send({url: url});
    res.end();
})

app.get("/dashboard", authorization, (req, res) => {
    res.render("user/index", {
        title: titleName,
        data: books,
    })
})

/* End  */

/* Admin */
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
        let jwtSecretKey = JWT_SECRET_KEY;
        let data = {
            username: name,
            password: pwd,
            time: Date(),
        }
        const token = jwt.sign(data, jwtSecretKey,{
            expiresIn: '1d',
        });
        res.cookie("admin_token", token);
        res.send({status: 200})
    }else{
        res.send({status: 404})
    }
})

app.post("/api/adminlogout", (req, res) => {
    res.clearCookie("admin_token")
    .status(200)
    res.send({url: url});
    res.end();
})

app.get("/admin_dashboard", adminAuthorization,(req, res) => {
    res.render("admin/admin_index", {
        title: titleName,
        data: books,
    })
})
/* End */

/* Sockets */

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
            if((book.bookName == addBook[0].bookName) || (book.bookState == "Removed")){
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
        var found = false;
        books.forEach(book =>{
            if(book.bookName == returnB[0].bookName && book.bookState != "Available"){
                book.bookState = "Available";
                found = true;
            }
        })
        var status;
        if(found){
            status = 200;
            booksIssued.forEach(book => {
                if(book.bookName == returnB[0].bookName && book.bookState != "Available"){
                    book.bookReturnDate = returnB[0].returnDate;
                    book.fineCollected = returnB[0].fineCollected;
                    if(returnB[0].fineCollected) book.fineAmount = bookFine;
                    else book.fineAmount = 0;
                }
            })        
        }else{
            status = 500;
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

/* End */


server.listen(port, (req, res) => {
    console.log("App is running on port 3000")
})