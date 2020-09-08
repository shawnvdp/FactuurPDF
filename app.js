const expressSanitizer = require("express-sanitizer"),
  express = require("express"),
  app = express(),
  puppeteer = require("puppeteer"),
  path = require("path");

const PORT = process.env.PORT || 3000;


app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

//express body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use(expressSanitizer());


let formData;

app.get("/", (req, res) => {
  res.redirect("form");
});

app.get("/form", (req, res) => {
  res.render("forms/form");
});

app.get("/form/:id", (req, res) => {
  res.render(`forms/${req.params.id}`);
});

app.post("/form", (req, res) => {
  console.log(req.body);
  // formData = req.sanitize(req.body);
  // formData = req.sanitize(req.body.test);
  // res.redirect("export");
});


/*
* TODO: NEW ROUTE LAYOUT -> PUT IN OWN ROUTE FOLDER {INVOICES/FORM}
*
//landing page overview
app.get("/", (req, res) => {});
//form to construct new PDF 
app.get("/form", (req, res) => {});
//retrieve all invoices, use to list all invoice files with clickable links to retrieve/display each one with the /invoices/:id route
app.get("/invoices", (req, res) => {});
//receive form data, construct PDF with request body data here -> redirect to /invoices/id after finished constructing PDF
app.post("/invoices", (req, res) => {});
//get specific PDF id (filename = invoice #?) -> safe PDF as file and then serve file with id of invoice number?
app.get("/invoices/:id", (req, res) => {}); */

app.get("/invoice", (req, res) => {
  res.render("invoices/invoice", { test: formData });
});


app.get("/export", (req, res) => {
  constructPDF()
    .then(pdf => {
      res.set({
        "Content-Type": "application/pdf",
        "Content-Length": pdf.length
      });

      res.send(pdf);
    });
});

app.listen(PORT, () => console.log(`server listening on port ${PORT}`));

async function constructPDF() {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    headless: true
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/invoice", { waitUntil: "networkidle0" });
  const pdf = await page.pdf({
    format: "A4", printBackground: true
  });

  await browser.close();
  return pdf;
}

// async function constructPDF() {
//   const browser = await puppeteer.launch({ headless: true });
//   const page = await browser.newPage();
//   await page.goto("http://localhost:3000/invoice", { waitUntil: "networkidle0" });
//   const pdf = await page.pdf({ format: "A4", printBackground: true });

//   await browser.close();
//   return pdf;
// }