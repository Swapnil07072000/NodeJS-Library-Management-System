$(function(){

    adminload(); //Load the Data
    socketConnection(); //Create Socket Connection

    /* Admin-Login Form Submit */
    $('.admin-form').submit(function(e){
        var uname = $('#admin-uname').val();
        var pwd = $('#admin-pwd').val();
        adminlogin(uname, pwd);
        var page = "admin_dashboard";
        admin_load_page(page);
        //e.preventDefault()
    })

    $('.adminlogoutbtn').on('click', function(){
        adminlogout();
    })
    /* End */

    /* Add Book */
    $('.form1').submit(function(e){
        insert();
        e.preventDefault();
        document.getElementsByClassName('form1')[0].reset();
    })

    /* Edit Book */

    $('.table1').on('click', '.editbtn', function(){
        var currentRow=$(this).closest("tr"); 
        let bookName = currentRow.find('td:eq(1)').text();
        let bookAuthor = currentRow.find('td:eq(2)').text();
        let bookPages = currentRow.find('td:eq(3)').text();
        let bookPrice = currentRow.find('td:eq(4)').text();
        let bookState = currentRow.find('td:eq(5)').text();
        $('#oldBookName').html(bookName)
        $('#editModal #bookName').val(bookName)
        $('#editModal #bookAuthor').val(bookAuthor)
        $('#editModal #bookPages').val(bookPages)
        $('#editModal #bookPrice').val(bookPrice)
        if(bookState == 'Issued') alert("Issued Books cannot be edited")
        else $('#editModal').modal("show")
    })

    $('.editNewbtn').on('click', function(){
        let oldBookName = $('#oldBookName').text()
        let bookName = $('#editModal #bookName').val()
        let bookAuthor = $('#editModal #bookAuthor').val()
        let bookPages = $('#editModal #bookPages').val()
        let bookPrice = $('#editModal #bookPrice').val()
        editInfo(oldBookName, bookName, bookAuthor, bookPages, bookPrice)
        adminload();
    })
    /* End */


    /* Issue Book */
    $('.table1').on('click', '.issuebtn', function(){
        var currentRow=$(this).closest("tr"); 
        let bookName = currentRow.find('td:eq(1)').text();
        //currentRow.find("td:eq(5)").html(" ").append("Issued");
        var now = new Date();
        var month = (now.getMonth() + 1);               
        var day = now.getDate();
        if (month < 10) 
            month = "0" + month;
        if (day < 10) 
            day = "0" + day;
        var today = now.getFullYear() + "-" + month + "-" + day;
        var someDate = new Date();
        someDate.setDate(someDate.getDate() + 15); //number  of days to add, e.x. 15 days
        var dueMonth = (someDate.getMonth() + 1);
        var dueDay = someDate.getDate();
        if (dueMonth < 10) 
            dueMonth = "0" + dueMonth;
        if (dueDay < 10) 
            dueDay = "0" + dueDay;
        var dueDay = now.getFullYear()+ "-" + dueMonth + "-" + dueDay;
        $('#bookDue').val(dueDay)
        $('#title').html('Issue Book')
        $('#bookName').val(bookName).attr('readonly', true);
        $('#bookIssuedTo').val("").attr('readonly', false);
        $('#dueDate').hide()
        $("#bookDue").hide();
        $('.cnfissuebtn').show();
        $('#todaysDate').val(today).attr('readonly', true);
        $('#issueModal').modal("show")
    })

    $('.cnfissuebtn').on('click', ()=>{
        let bookName = $('#bookName').val();
        let issuedTo = $('#bookIssuedTo').val();
        let issuedDate = $('#todaysDate').val();
        let bookDueDay = $('#bookDue').val();
        if(issuedTo == ""){
            alert("Please Fill Issuer Name/ID")
        }
        else{	
            issue(bookName, issuedTo, issuedDate, bookDueDay);
            issueInfo(bookName);
        }
    })

    $('.table1').on('click', '.issueinfobtn', function(){
        var currentRow=$(this).closest("tr"); 
        let bookName = currentRow.find('td:eq(1)').text();
        issueInfo(bookName);
    })
    /* End */

    /* Return Book */
    $('.table1').on('click', '.returnbtn', function(){
        var currentRow=$(this).closest("tr"); 
            let bookName = currentRow.find('td:eq(1)').text();
            let bookState = currentRow.find('td:eq(5)').text();
            //currentRow.find("td:eq(5)").html(" ").append("Available");
            var now = new Date();
        var month = (now.getMonth() + 1);               
        var day = now.getDate();
        if (month < 10) 
            month = "0" + month;
        if (day < 10) 
            day = "0" + day;
        var today = now.getFullYear() + "-" + month + '-' + day;
            if(bookState == "Issued") returnIssued(bookName, today)
            else alert("Book Available")
    })

    $('.returnIssuedbtn').on('click', function() {
        let bookName = $('#returnModal #bookName').val();
        let dueDate = $('#returnModal #bookDue').val();
        let returnDate = $('#returnModal #returnDate').val();
        if(returnDate == "") alert("Please Select Return Date")
        else{
            var fineCollected = false
            if(returnDate < dueDate){
                fineCollected = false
            }else if(returnDate > dueDate){
                fineCollected = true
            } 
            returned(bookName, returnDate, fineCollected);
        }
    })

    /* End */

    /* Delete Book */

    $('.table1').on('click', '.deletebtn', function(){
        var socket = returnSocket();
        var removeBook = false
        removeBook = confirm("Confirm That Book to be removed")
        if(removeBook){
            var currentRow=$(this).closest("tr"); 
            let bookName = currentRow.find('td:eq(1)').text();
            var data = [
                {
                    "bookName": bookName,
                }
            ]
            socket.emit("/api/delete", {
                data: data,
            })
            socket.on("/api/delete", (data)=>{
                var deleteInfo = data.data
                if(deleteInfo[0].status == 200) adminload()
                else alert("Error")
            })
        }
    })
    /* End */

})

/* Sockets */
function returnSocket(){
    var socket = io();
    return socket;
}

function socketConnection(){
    //Sockets
	var socket = returnSocket();
	//Socket Connection
    socket.on("connect", function(){
        console.log("Connected")
    })
}

/* End */

function adminload(){
    var socket = returnSocket();
    socket.emit("load")
    socket.on("tabledata", (data) => {
        var bookList = data.data;
        $('.table1').DataTable().clear().draw();
        for(var i in bookList){
            var bookName = bookList[i].bookName
            var bookAuthor = bookList[i].bookAuthor
            var bookPages = bookList[i].bookPages
            var bookPrice = bookList[i].bookPrice
            var bookState = bookList[i].bookState
            var btnEdit = '<button type="button" class="editbtn btn btn-primary">Edit</button>'
            var btnIssue;
            var btnReturn = '<button type="button" class="returnbtn btn btn-warning">Return</button>'
            var btnDelete = '<button type="button" class="deletebtn btn btn-danger">Remove</button>'
            if(bookState == "Removed"){
                btnEdit = '<i class="bi bi-slash-circle-fill text-danger d-flex justify-content-center" style="font-size: 1.5rem"></i>'
                btnIssue = '<i class="bi bi-slash-circle-fill text-danger d-flex justify-content-center" style="font-size: 1.5rem"></i>'
                btnReturn = '<i class="bi bi-slash-circle-fill text-danger d-flex justify-content-center" style="font-size: 1.5rem"></i>'
                btnDelete = '<i class="bi bi-slash-circle-fill text-danger d-flex justify-content-center" style="font-size: 1.5rem"></i>'
            }
            else if(bookState == 'Issued'){
                btnIssue = '<button type="button" class="issueinfobtn btn btn-info">Info</button>'
            }else{
                btnIssue = '<button type="button" class="issuebtn btn btn-info">Issue</button>'
            }
            
            $('.table1').DataTable().row.add([
                parseInt(i)+1,
                bookName,
                bookAuthor,
                bookPages,
                bookPrice,
                bookState,
                btnEdit,
                btnIssue,
                btnReturn,
                btnDelete,
            ]).draw();
            
        }	
    })
}

/* Admin Functions */

function adminlogin(name, pwd){
    data = {
        name: name,
        pwd: pwd,
    }
    $.ajax({
        type: "post",
        url: "/api/adminlogin",
        data: data,
        dataType: "json",
        success:function(data){
            if(data.status == 200){
                //
            }else if(data.status == 404){
                alert("Invalid Username or Password")
            }
        }
    })
}

function adminlogout(){
    $.ajax({
        type: "post",
        url: "/api/adminlogout",
        success: function(data){
            window.location.reload();
            window.location.href = data.url;
        }
    })
}

/* End */

/* Load Page */

function admin_load_page(pageName){
    data = {
        page: pageName,
    }
    $.ajax({
        type: "post",
        url: "/adminPageName",
        data: data,
        success: function(data){
            if(data.status == 200){
                //alert("Logged IN");
            }
        }
    })
}

/* End */

/* Add Book */
function insert(){
    var socket = returnSocket();
    let name = $('#name').val(); 
    let author = $('#author').val(); 
    let pages = $('#pages').val();
    let price = $('#prices').val();
    data = [
        {
            "bookName": name,
            "bookAuthor": author,
            "bookPages": pages,
            "bookPrice": price
        }
    ]
    socket.emit("/api/add", {
        data: data,
    })
    socket.on("/api/add", (data) => {
        var data = data.data;
        if(data[0].status == 200){
            adminload();
        }else if(data[0].status == 409){
            alert("Book already present with the same name")
        }
    })
}
/* End */

/* Edit Book */

function editInfo(oldBookName, bookName, bookAuthor, bookPages, bookPrice){
    var socket = returnSocket();
    var data = [
        {
            "oldBookName": oldBookName,
            "bookName": bookName,
            "bookAuthor": bookAuthor,
            "bookPages": bookPages,
            "bookPrice": bookPrice,
        }
    ]

    socket.emit("/api/edit", {
        data: data,
    })
    socket.on("/api/edit", (data) =>{
        var newInfo = data.data
        if(newInfo[0].status == 200){
            alert('Saved Successfully');
        }else if(newInfo[0].status == 500){
            alert('Error');
        } 
    })
}

/* End */

/* Issue Book */
function issue(bookName, issuedTo, issuedDate, bookDueDay){
    var socket = returnSocket();
    data = [
        {
            "bookName": bookName,
            "issuedTo": issuedTo,
            "issuedDate": issuedDate,
            "bookDueDay": bookDueDay,
        }
    ]
    socket.emit("/api/issue", {
        data: data,
    })
    socket.on("/api/issue", (data) => {
        var data = data.data;
        if(data[0].status == 200){
            adminload();
        } 
        else if(data[0].status == 500) alert("Book Issued")
    })

}

function issueInfo(bookName){
    var socket = returnSocket();
    var data = [
            {
                "bookName": bookName,
            }
        ]
        socket.emit("/api/issueInfo",{
            data: data,
        })
        socket.on("/api/issuedInfo", (data)=> {
            var info = data.data
            //console.log(info[0].status)
            if(info[0].status == 200){
                $('#title').html("Issued Book Info")
                $('#bookName').val(bookName).attr('readonly', true);
                $('#bookIssuedTo').val(info[0].issuedName).attr('readonly', true);
                $('#todaysDate').val(info[0].issuedDate).attr('readonly', true)
                $('#bookDue').val("").val(info[0].bookDueDate).attr('readonly', true)
                $('.cnfissuebtn').hide();
                $('#dueDate').show();
                $('#bookDue').show();
                $('#issueModal').modal("show")
                
            }else if(info[0].status == 500){
                alert("Book not been Issued")
            }
        })
}
/* End */

/* Return Book */
function returned(bookName, returnDate, fineCollected){
    var socket = returnSocket();
    data = [
        {
            "bookName": bookName,
            "returnDate": returnDate,
            "fineCollected": fineCollected,
        }
    ]
    socket.emit("/api/return", {
        data: data,
    })
    socket.on("/api/return", (data) => {
        var data = data.data;
        if(data[0].status == 200){
            $('#returnModal').modal("toggle")
            $('#returnModal #returnDate').val("")
            adminload();
        }else if(data[0].status == 500) alert("Books Available")
    })
}

function returnIssued(bookName, todayDate){
    var socket = returnSocket();
    var data = [
            {
                "bookName": bookName,
            }
        ]
    socket.emit("/api/returnInfo",{
        data: data,
    })
    socket.on("/api/returnInfo", (data)=> {
        var info = data.data
        //console.log(info[0].status)
        if(info[0].status == 200){
            $('#returnModal #title').html("Book Info")
            $('#returnModal #bookName').val(bookName).attr('readonly', true);
            $('#returnModal #bookIssuedTo').val(info[0].issuedName).attr('readonly', true);
            $('#returnModal #todaysDate').val(info[0].issuedDate).attr('readonly', true)
            $('#returnModal #bookDue').val("").val(info[0].bookDueDate).attr('readonly', true)
            //$('#returnModal #dueDate').show();
            $('#returnModal #bookDue').show();
            var dueDate = $('#returnModal #bookDate').val()
            if(todayDate > dueDate){
                $('#fineTag').html("Fine");
            }else{
                $('#fineTag').hide();
            }
            $('#returnModal').modal("show")
        }else if(info[0].status == 500){
            alert("Book not been Issued")
        }
    })

}
/* End */

