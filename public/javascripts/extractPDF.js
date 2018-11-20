var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var phantom = require('phantom');
var async = require("async");
var extract = require('pdf-text-extract');
var hummus = require('hummus');
var path = require('path');
var convertToLat = require('cyrillic-to-latin')
const convertToCyr = require('latin-to-serbian-cyrillic')
const hasCyr = require('has-cyr');
const pdftotext = require('pdftotextjs');
const PDFDocument = require('pdfkit')



// GET FROM COMANDLINE PARAMETER
const args = process.argv.slice(2)
console.log(process.argv.length);

var file = args[2]

function extractPDF(keywords1, company, today, id) {
  let sourceArr = []
  //  PUSH IN ARR
    sourceArr.push(file)
  
  if (sourceArr.length) {
    for (let i = 0; i < sourceArr.length; i++) {
      // FOR EACH SOURCE START FUNCTION TO EXTRACT SINGLE PAGE WHERE KEYWORD EXIST
      try {
        extractA(sourceArr[i], keywords1, company, today, id);
      }
      catch (e) {
        // handle the unsavoriness if needed
      }
    }
  }
}

function extractA(source, keywords1, company, today, id) {
  if (typeof source != 'undefined') {
    var sourcePDF = path.join(__dirname, `/source/${source}`);
    var outputFolder = path.join(__dirname, '/output/');
    var keywords = keywords1 || [];

    try {
      extract(sourcePDF, (err, pages) => {
        if (err) console.log(err);
        for (let i = 0; i < pages.length; i++) {
          let keywordsConverted = keywords1
          // CHECKING IF PAGES ON PDF ARE ON CYRILIC IF THEY ARE WE CONVERT KEYWORDS TO CYRILIC
          let cyr = hasCyr(pages[i])
          if (cyr) {
            keywordsConverted = keywords.map(word => convertToCyr(word))
          }
          if (keywordsConverted.some(function (v) { return pages[i].toLowerCase().indexOf(v.toLocaleLowerCase()) >= 0; })) {
            var name = Math.random().toString(36).substring(10);
            var pdfWriter = hummus.createWriter(path.join(outputFolder, `${today}|${company}|${id}|${source}|${name}.pdf`));
            pdfWriter.appendPDFPagesFromPDF(sourcePDF, { type: hummus.eRangeTypeSpecific, specificRanges: [[i, i]] });
            pdfWriter.end();
            // CALL MODIFY() TO CREATE A HTML FROM SINGLE PDF 
            modify(keywords, today, company);
          }
        }
      });
    } catch (e) {
      // handle the unsavoriness if needed
    }
  }
}
// END OF  EXTRACT 

async function modify(keywords, today, company) {
  doc = new PDFDocument
 
  let source = []
  var sourceFolder = path.join(__dirname, '/source/');

  // GET FROM COMANDLINE PARAMETER
  source.push(file)
  let textArr = []

  for (let single of source) {
    // CREATE HTML ONLY FOR PDFS THAT ARE EXTRACTED TODAY
      const p = takeText(single, keywords, sourceFolder)
      textArr.push(p)
  }
  Promise.all(textArr).then(
    data => async.map(data, writeHmtl, function (err, results) {
    })
  )
}

async function takeText(single, keywords, sourceFolder) {
  doc = new PDFDocument
  let inputFile = path.join(sourceFolder, single)
  let modified = __dirname + `/modified/${single}-modified.html`
  let pdf = new pdftotext(inputFile);
  const data = pdf.getTextSync(); // returns buffer
  let text = data.toString('utf8').toLowerCase(); // bilo je 'utf8'
  return textObj = { text: text, link: modified, keywords: keywords }
}

function writeHmtl(obj) {
  let keyword = obj.keywords
  keyword.forEach(word => {
    if (hasCyr(obj.text)) {
      word = convertToCyr(word)
    }
    obj.text = obj.text.replace(new RegExp(word, 'g'), "<span style ='color:red'><b>" + word.toUpperCase() + "</b></span>")
  })
  fs.writeFile(obj.link, obj.text, function (err) {
    if (err) throw err;

  }
  )
}

module.exports.extractPDF = extractPDF;