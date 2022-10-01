$(function(){
    /* User-Login Form Submit */
    $('.user-form').submit(function(e){
        var uname = $('#uname').val();
        var pwd = $('#pwd').val();
        userlogin(uname, pwd);
        var page = "dashboard";
        user_load_page(page);
        //e.preventDefault();
    })

    $('.userlogoutbtn').on('click', function(){
        userlogout();
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
        //console.log(bookDueDay);
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


    /* DashBoard */
    socketConnection();
    load()
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

/* User Functions */

function userlogin(name, pwd){
    data = {
        name: name,
        pwd: pwd,
    }
    $.ajax({
        type: "post",
        url: "/api/userlogin",
        data: data,
        dataType: "json",
        success:function(data){
            if(data.status == 200){
                //document.cookie = "User-Token="+data.token
            }else if(data.status == 404){
                alert('User not Present')
                
            }
        }
    })
}

function userlogout(){
    $.ajax({
        type: "post",
        url: "/api/userlogout",
        success: function(data){
            document.cookie =  'User-Token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            window.location.reload();
            window.location.href = data.url;
        }
    })
}

function user_load_page(pageName){
    //let cookieName = getCookie("User-Token")
    data = {
        page: pageName,
        //token: cookieName,
    }
    
    $.ajax({
        type: "post",
        url: "/pageName",
        data: data,
        success: function(data){
            if(data.status == 200){
                console.log("Logged IN");
            }
        }
    })
}


/* End */

/* Load Page */

function load(){
    var socket = returnSocket();
    socket.emit("load")
    socket.on("tabledata", (data) => {
        var bookList = data.data;
        $('.table1').DataTable().clear().draw();
        let counter = 1;
        for(var i in bookList){
            var bookName = bookList[i].bookName
            var bookAuthor = bookList[i].bookAuthor
            var bookPages = bookList[i].bookPages
            var bookPrice = bookList[i].bookPrice
            var bookState = bookList[i].bookState
            var btnIssue;
            if(bookState == 'Issued'){
                btnIssue = '<button type="button" class="issueinfobtn btn btn-info">Info</button>'
            }else{
                btnIssue = '<button type="button" class="issuebtn btn btn-info">Issue</button>'
            }
            var btnReturn = '<button type="button" class="returnbtn btn btn-warning">Return</button>'
            if(bookState != "Removed"){
                $('.table1').DataTable().row.add([
                    counter,
                    bookName,
                    bookAuthor,
                    bookPages,
                    bookPrice,
                    bookState,
                    btnIssue,
                    btnReturn,
                ]).draw();
                counter++
            }
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
            load();
            
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
            load();
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
