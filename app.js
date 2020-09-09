const expressSanitizer = require("express-sanitizer"),
  express = require("express"),
  app = express(),
  puppeteer = require("puppeteer"),
  path = require("path"),
  methodOverride = require("method-override");

const PORT = process.env.PORT || 3000;

const { query, updateInvoice, addInvoiceToDb } = require("./database");
const connection = require("./db");

connection.connect();

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

//express body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

app.use(expressSanitizer());


app.get("/", async (req, res) => {
  let invoices = await query("SELECT * FROM invoice");
  res.render("index", { invoices });
});

// ** INVOICE **

//NEW FORM
app.get("/invoice/new", (req, res) => {
  res.render("invoices/new");
});

//CREATE
app.post("/invoice", async (req, res) => {
  let success = await addInvoiceToDb(req.body);
  if (!success) {
    res.send("Factuurnummer bestaat al in de database.");
  } else {
    res.redirect("/");
  }
});

//READ
app.get("/invoice/:id", async (req, res) => {
  let result = await query(`SELECT * FROM invoices.invoice WHERE id = ${req.params.id}`);

  if (!result.length) {
    res.redirect("/");
    throw new Error(`No result found in database for id: ${req.params.id}`);
  }

  res.render("invoices/index", { formData: result });
});

//EDIT FORM
app.get("/invoice/:id/edit", async (req, res) => {
  let invoice = await query(`SELECT * FROM invoices.invoice WHERE id = ${req.params.id}`);
  let materials = await query(`SELECT materials.* FROM invoice INNER JOIN invoice_materials im ON im.invoice_id = invoice.id INNER JOIN materials ON im.materials_id = materials.id AND invoice.id = ${req.params.id}`);

  if (!invoice.length) {
    res.redirect("/");
    throw new Error(`No result found in database for id: ${req.params.id}`);
  }
  invoice[0].date = invoice[0].date.toISOString().substr(0, 19).replace("T", " ").split(" ")[0];
  invoice[0].enddate = invoice[0].enddate.toISOString().substr(0, 19).replace("T", " ").split(" ")[0];

  res.render("invoices/edit", { invoice: invoice[0], materials, id: req.params.id });
});

//UPDATE
app.put("/invoice/:id", async (req, res) => {
  updateInvoice(req.body);
  res.redirect(`/invoice/${req.params.id}`);
});

app.get("/export/:id", (req, res) => {
  constructPDF(req.params.id)
    .then(pdf => {
      res.set({
        "Content-Type": "application/pdf",
        "Content-Length": pdf.length
      });

      res.send(pdf);
    });
});

app.listen(PORT, () => console.log(`server listening on port ${PORT}`));

async function constructPDF(id) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    headless: true
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:3000/invoice/${id}`, { waitUntil: "networkidle0" });
  const pdf = await page.pdf({
    format: "A4", printBackground: true
  });

  await browser.close();
  return pdf;
}
