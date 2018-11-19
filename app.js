var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var extractPDF = require('./public/javascripts/extractPDF.js')
const axios = require('axios');
var ontime = require('ontime')
var fs = require('fs');

var app = express();


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});


// GET FROM PHP COMPANY AND KEYWORD <<<<<<-------------
        axios.get('https://press-cliping.herokuapp.com/api/companies?api_key=23')
          .then(async response => {
            if (response.data.success == true) {
              let today = new Date();
              let datestring = today.getDate().toString() + "-" + (today.getMonth() + 1) + "-" + today.getFullYear()
              let companies = response.data.company
              companies.map(company => {
                let keywords = []
                company.keywords.map(word => keywords.push(word.name))
                extractPDF.extractPDF(keywords, company.name, datestring, company.id)

//WHEN EXTRACT HTML AFTER 4s WE START TO SEND HTML MERGED BACK TO PHP ------->>>>>>
        setTimeout(function () {
          let htmlSingleArr = []
          let singleHTMLSource = path.join(__dirname, '/public/javascripts/modified')
          fs.readdirSync(singleHTMLSource).forEach(file => {

            htmlSingleArr.push({
              single_page_src: file,
            })

            Promise.all(htmlSingleArr).then(
              data =>
                axios({
                  method: 'POST',
                  url: 'https://press-clip-new.herokuapp.com/api/nikola',
                  data: {
                    api_key: "sdsd",
                    data: data
                  }
                })
                .then(function (response) {
                    console.log(data);
                    console.log("HTML was Send!!!");
                  })
                )
                .then(response => {
                    process.exit()
                })
                .catch(response=>{
                   if(err) throw err;
                })
          })
        }, 4000)
      })
    }
  })



app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
