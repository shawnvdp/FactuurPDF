const expressSanitizer = require("express-sanitizer"),
bodyParser = require("body-parser"),
express = require("express"),
app = express(),
puppeteer = require("puppeteer");


app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());

let formData;

app.get("/", function(req, res){
  res.render("forms/form");
});

app.get("/invoice", function(req, res){
  res.render("invoices/invoice", {test: formData});
});


app.post("/form", function(req, res){
  formData = req.sanitize(req.body.test);
  res.redirect("/export");
});

app.get("/export", function(req, res){
  constructPDF()
  .then(pdf => {
    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdf.length
    });

    res.send(pdf);
  });
});

app.listen(3000, function(){
  console.log("server listening on port 3000");
});

async function constructPDF(){
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/invoice", {waitUntil: 'networkidle0'});
  const pdf = await page.pdf({format: 'A4', printBackground: true });

  await browser.close();
  return pdf;
}