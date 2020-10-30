const express = require('express');
const path=require('path')
const hbs=require('express-handlebars')
const bodyparser=require('body-parser')
const mysql=require('mysql')
const session=require('express-session')

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'abhisheknodepractice@gmail.com',
    pass: 'Abhi@1234'
  }
});

const app = express();

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server started on port ${PORT}`))

app.set('views',path.join(__dirname,'views'))
app.set('view engine','hbs')

app.engine('hbs',hbs({
  extname:'hbs',
  defaultlayout:'main',
  layoutsDir:__dirname+'/views/layouts/'
}))

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({
	extended:true
}))

app.use(function (req, res, next) {
  res.set(
    'Cache-Control',
    'no-cache,private,no-store,must-revalidate,max-state=0,post-check=0,pre-check=0'
  );
  next();
});

app.use(session({ secret: 'asasasasas' }));

var con=mysql.createConnection({
  user:'root',
  password:'root',
  port:3307,
  host:'localhost',
  database:'cms'
})

app.get('/',(req,res)=>{
	res.render('loginpage')
})

app.get('/logout',(req,res)=>{
  req.session.destroy();
  res.render('loginpage',{msg:'Logout successfully'})
})

//########################## ADMIN LOGIN #############################

app.post('/adminlogin',(req,res)=>{
	var logid=req.body.adminid;
	var pwd=req.body.adminpass;
  req.session.admin = logid;
	var sql="select * from admin where loginid=? and password=?;"
	var values=[logid,pwd]
	sql=mysql.format(sql,values)
	con.query(sql,(err,result)=>{
		if(err) throw err;
		else if(result.length>0){
      var inb="select * from plans;"
        con.query(inb,(err,result)=>{
		res.render('adminhome',{uid:req.session.admin,data:result})
    console.log(result);
  })
}
		else{
			response.render('loginpage',{msg:'login fail, try again...!!!'})
		}
	})
})

//########################## CUSTOMER LOGIN #############################

app.post('/customerlogin',(req,res)=>{
  var usid = req.body.custid;
  var pas = req.body.custpass;
  req.session.customer = usid;
	var sql="select * from customer where emailid=? and password=?;"
	var values=[usid,pas]
	sql=mysql.format(sql,values)
	con.query(sql,(err,result)=>{
		if(err) throw err;
		else if(result.length>0){
      var name = result[0].cname;
		res.render('customerHome',{uname:name, uid:req.session.customer,data:result})
}
		else{
			res.render('loginpage',{msg:'login fail, try again...!!!'})
		}
	})
})

//########################## GET REQUESTS #############################

app.get('/adminhome',(req,res)=>{
  var inb="select * from plans;"
    con.query(inb,(err,result)=>{
res.render('adminhome',{uid:req.session.admin,data:result})
})
})

app.get('/addcustomer',(req,res)=>{
	res.render('addcustomer',{uid:req.session.admin})
})

app.get('/customerHome',(req,res)=>{
  var unid = req.session.customer;
  var sql="select * from customer where emailid=?;"
  var values=[unid]
  sql=mysql.format(sql,values)
  con.query(sql,(err,result)=>{
    if(err) throw err;
    else{
        var name = result[0].cname;
        res.render('customerHome',{uname:name, uid:req.session.customer,data:result})
    }
  })
})

app.get('/addAcc',(req,res)=>{
  var sqlcustomer="select * from customer;"
  con.query(sqlcustomer,(err,customerlist)=>{
    var sqlplans="select * from plans;"
    con.query(sqlplans,(err,plan)=>{
res.render('addAccount',{uid:req.session.admin,customername:customerlist, plans:plan })
})
})
})


//########################## View Customer Accounts#############################

app.get('/viewAccount',(req,res)=>{
  var inb="select * from account;"
    con.query(inb,(err,result)=>{
res.render('viewAccount',{uid:req.session.admin,data:result})
})
})

//########################## View Self Customer Accounts#############################

app.get('/custSelfAcc',(req,res)=>{
  var email = req.session.customer;
  var sql="select * from customer where emailid=?;"
  var values=[email]
  sql=mysql.format(sql,values)
  con.query(sql,(err,result)=>{
    if(err) throw err;
    else{
        var name = result[0].cname;
        var inb="select * from account where cname=?;"
        var val=[name]
        inb=mysql.format(inb,val)
          con.query(inb,(err,result)=>{
            if (err) throw err;
            else
      res.render('customerSelfAccount',{uid:req.session.customer,data:result, uname:name})
      })
    }
  })

})

// app.get('/admininsert',(req,res)=>{
//
//   var sql="insert into admin(loginid,password)values(?,?);"
//   var values=["adminid","admin123"]
//   sql=mysql.format(sql,values)
//   con.query(sql,(err,result)=>{
//     if(err) throw err;
//     else
//       res.render('loginpage',{msg:'Admin data inserted'})
//   })
//
// })

//########################## View Customer #############################

app.get('/viewcustomer',(req,res)=>{
  var sql="select * from customer;"
    con.query(sql,(err,result)=>{
res.render('viewCustomer',{uid:req.session.admin,data:result})
})
})

//########################## ADD NEW HOSTING PLAN #############################

app.post('/addHPlan',(req,res)=>{
  var pname = req.body.plname;
  var charge = req.body.charges;
  var sql="insert into plans(pname,pcharges)values(?,?);"
	var values=[pname,charge]
  sql=mysql.format(sql,values)
  con.query(sql,(err,result)=>{
		if(err) throw err;
		else{
      var inb="select * from plans;"
        con.query(inb,(err,result)=>{
    res.render('adminhome',{uid:req.session.admin, data:result, msg:'Plan Added'})
  //  console.log(result);
  })
      }
	})
})

//########################## ADD NEW CUSTOMER #############################


app.post('/addCust',(req,res)=>{
  var cname = req.body.custname;
  var mobnum = req.body.mnum;
  var cemail = req.body.email;
  var password = Math.random().toString(36).substring(2, 10);
//console.log(password);
  var sql="insert into customer values(?,?,?,?);"
	var values=[cname,mobnum,cemail,password]
	sql=mysql.format(sql,values)
  con.query(sql,(err,result)=>{
    if (err) throw err;
    else{
      var mailOptions = {
        from: 'abhisheknodepractice@gmail.com',
        to: cemail,
        subject: 'Your CMS Account Password',
        text: 'Hello '+cname+",Your New CMS Account password is "+ password
      };
      transporter.sendMail(mailOptions, function(err, info){
        if (err) throw err;
        else {
          res.render('addcustomer',{msg:'New Customer Added,', uid:req.session.admin})
        }
          })
}
})
})

//########################## Add Customer Account #############################

app.post('/addAcc',(req,res)=>{
  var cname = req.body.custName;
  var doName = req.body.dname;
  var plc = req.body.plcName;
  var dtaken = req.body.domainTaken;
  var regdate = req.body.regdate;
  var expdate = req.body.expdate;
  var tPeriod = parseInt(req.body.plduration);
  var hcharge = parseInt(req.body.hcharges);
  var dcharge = parseInt(req.body.dcharges);
  var totcharge = hcharge+dcharge;
  var plan;
  var sqlone = "select pname from plans where pcharges=?"
  var val=[plc]
  sqlone=mysql.format(sqlone,val)
  con.query(sqlone,(err,result)=>{
  if(err) throw err;
  else
   plan = result[0].pname;
   var sqltwo = "insert into account values(?,?,?,?,?,?,?,?,?,?)"
   var values = [cname,doName,plan,dtaken,regdate,expdate,tPeriod,hcharge,dcharge,totcharge]
   sqltwo=mysql.format(sqltwo,values)
  con.query(sqltwo,(err,result)=>{
    if(err) throw err;
    else{
       var sqlcustomer="select * from customer;"
       con.query(sqlcustomer,(err,customerlist)=>{
         var sqlplans="select * from plans;"
         con.query(sqlplans,(err,plan)=>{
     res.render('addAccount',{uid:req.session.admin,customername:customerlist, plans:plan,msg:'Account Created' })
     })
     })
     }
  })
     });
})

//########################## Change Customer Password #############################

app.post('/changePass',(req,res)=>{
  var oldp = req.body.oldPwd;
  var newp = req.body.newPwd;
  var email = req.session.customer;
//--------------------------------------

var sql="select * from customer where emailid=? and password=?;"
var values=[email,oldp]
sql=mysql.format(sql,values)
con.query(sql,(err,result)=>{
  if(err) throw err;
  else if(result.length>0){
  var inb="update customer set password=? where emailid=?;"
  var val=[newp,email]
  inb=mysql.format(inb,val)
  con.query(inb,(err,result)=>{
  if(err) throw err;
  else{
    var sql="select * from customer where emailid=?;"
    var values=[email]
    sql=mysql.format(sql,values)
    con.query(sql,(err,result)=>{
      if(err) throw err;
      else{
        var name = result[0].cname;
      res.render('customerHome',{
        uname:name,
        uid:req.session.customer,
        data:result,
        msg:'password changed...!!!'})
        }
    })
  }
  })
}
  else{
    var sql="select * from customer where emailid=?;"
    var values=[email]
    sql=mysql.format(sql,values)
    con.query(sql,(err,result)=>{
      if(err) throw err;
      else{
        var name = result[0].cname;
      res.render('customerHome',{
        uname:name,
        uid:req.session.customer,
        data:result,
        msg:'Current Password is Wrong...!!!'})
        }
    })
  }
})

})
