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


// GET FROM COMANDLINE COMPANY,ID AND KEYWORD <<<<<<-------------

          let today = new Date();
          let datestring = today.getDate().toString() + "-" + (today.getMonth() + 1) + "-" + today.getFullYear()
          let args = process.argv.slice(2);
          let oldHtml = args[3]
          let company = args[4]  
          let id = args[5]
          let keywords= args.slice(6, process.argv.length)
          extractPDF.extractPDF(keywords, company, datestring, id)

//WHEN EXTRACT HTML AFTER WE START TO SEND HTML MERGED BACK TO PHP ------->>>>>>
        var test = setInterval(function () {
          let htmlSingleArr = []
          let singleHTMLSource = path.join(__dirname, '/public/javascripts/modified')
          fs.readdirSync(singleHTMLSource).forEach(file => {

            htmlSingleArr.push({
              newHtml: file,
              oldHtml:oldHtml
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
                  if(data.length > 0){
                      console.log(data[0].oldHtml + ',' + data[0].newHtml);
                     
                      clearInterval(test)
                      process.exit()
                    }
                  })
                  )
                .catch(response=>{
                   if(err) throw err;
                })
          })
        }, 1)


app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
