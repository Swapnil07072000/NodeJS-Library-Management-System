const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { title } = require('process');
const port = process.env.port || 3000;

const titleName = "Library Management System";
const books = [
]

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

/* Get Method */
app.get("/", (req, res) => {
    res.render("pages/index", {
        title: titleName,
        data: books,
    })
})
/*
app.get("/load", (req, res) => {
    
    res.send(books);
})
*/
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