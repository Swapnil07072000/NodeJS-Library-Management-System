const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sessions = require('express-session');
const cookie = require('cookie-parser')
const { title } = require('process');
const cookieParser = require('cookie-parser');
const { on } = require('events');
const port = process.env.port || 3000;

const titleName = "Library Management System";
const books = [
]

var url = "http://localhost:3000/"

const app = express();
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
var session;

const user_credentials = [
    {
        username: "swapnil",
        password: "Swapnil@07"
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
        app.get('/page');
    }else{
        res.render("user/login")
    }
})

app.get("/admin", (req, res) => {
    session = req.session;
    if(session.userid){
        app.get('/admin_dashboard');
    }else{
        res.render("admin/admin_login")
    }
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
    if(req.session.userid){
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
    if(req.session.userid){
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
        session.userid = name;
        res.send({status: 200})
    }else{
        res.send({status: 404})
    }
})

app.post("/api/userlogout", (req, res) => {
    req.session.destroy();
    res.send({url: url});
})


app.post("/api/adminlogout", (req, res) => {
    req.session.destroy();
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
  
    books.forEach(book =>{
        if(book.bookName == inputBookName){
            found = true;
        }
    })

    if(found){
        res.send({status: 409}); //409 - Code already present
    }else{
        books.push({
            bookName: inputBookName,
            bookAuthor: inputBookAuthor,
            bookPages: inputBookPages,
            bookPrice: inputBookPrice,
            bookState: "Available"
        })
        res.send({status: 200, len: books.length});
    }
})

app.post('/api/issue', (req, res) => {
    var bookName = req.body.bookName;
    var found = false;
    books.forEach(book =>{
        if(book.bookName == bookName && book.bookState != "Issued"){
            book.bookState = "Issued";
            found = true;
        }
    })
    if(found){
        res.send({status: 200});
    }else{
        res.send({status: 500});
    }
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

app.listen(port, (req, res) => {
    console.log("App is running on port 3000")
})