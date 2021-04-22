const expressSanitizer = require("express-sanitizer"),
  express = require("express"),
  app = express(),
  puppeteer = require("puppeteer"),
  path = require("path"),
  methodOverride = require("method-override"),
  Database = require("./Database"),
  DB = new Database();


const PORT = process.env.PORT || 3000;

// const { query, updateInvoice, addInvoiceToDb, getInvoiceByNumber, getInvoiceMaterialsByNumber, getAllInvoices } = require("./database");
// const connection = require("./dbconnection");
const { DDMMYYYYToYYYYMMDD, formatInvoiceIdWithMinZeros } = require("./util");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

//express body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

app.use(expressSanitizer());


function sanitize(req, res, next) {
  const mapObj = {
    "€": "",
    " ": "",
    ",": "."
  };

  if (req.body.hours) {
    req.body.hours = req.body.hours.replace(/€| |,/g, matched => mapObj[matched]);
  }
  if (req.body.hourly) {
    req.body.hourly = req.body.hourly.replace(/€| |,/g, matched => mapObj[matched]);
  }
  if (req.body.materials && req.body.materials.price.length > 1) {
    req.body.materials.price = req.body.materials.price.map(n => n.replace(/€| |,/g, matched => mapObj[matched]));
  }
  next();
}

app.get("/", async (req, res) => {
  const invoices = await DB.getAllInvoices();
  res.render("index", { invoices });
});

// ** INVOICE **

//NEW FORM
app.get("/invoice/new", (req, res) => {
  res.render("invoices/new");
});

//CREATE
app.post("/invoice", sanitize, async (req, res) => {
  let success = await DB.createNewInvoice(req.body);
  if (!success) {
    res.send("Factuurnummer bestaat al in de database.");
  } else {
    res.redirect("/");
  }
});

//READ
app.get("/invoice/:id", async (req, res) => {
  const invoice = await DB.getInvoiceByNumber(req.params.id);
  const materials = await DB.getInvoiceMaterialsByNumber(req.params.id);

  console.log(invoice, materials);

  if (invoice == null) {
    res.redirect("/");
    throw new Error(`No result found in database for id: ${req.params.id}`);
  }

  invoice[0].invoiceNumber = formatInvoiceIdWithMinZeros(invoice[0].invoiceNumber);

  res.render("invoices/index", { invoice: invoice[0], materials, reminder: req.query.reminder, id: req.body.id });
});

//EDIT FORM
app.get("/invoice/:id/edit", async (req, res) => {
  const invoice = await DB.getInvoiceByNumber(req.params.id);
  const materials = await DB.getInvoiceMaterialsByNumber(req.params.id);

  if (!invoice.length) {
    res.redirect("/");
    throw new Error(`No result found in database for id: ${req.params.id}`);
  }

  invoice[0].date = DDMMYYYYToYYYYMMDD(invoice[0].date);
  invoice[0].enddate = DDMMYYYYToYYYYMMDD(invoice[0].enddate);

  res.render("invoices/edit", { invoice: invoice[0], materials });
});

//UPDATE
app.put("/invoice/:id", sanitize, (req, res) => {
  updateInvoice(req.body, () => {
    res.redirect("/");
  });
});

app.get("/export/:id", (req, res) => {
  constructPDF(req.params.id, req.query.reminder)
    .then(pdf => {
      res.set({
        "Content-Type": "application/pdf",
        "Content-Length": pdf.length
      });

      res.send(pdf);
    });
});

app.listen(PORT, () => console.log(`server listening on port ${PORT}`));

async function constructPDF(id, reminder) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    headless: true
  });
  const page = await browser.newPage();

  if (reminder) {
    await page.goto(`http://localhost:3000/invoice/${id}?reminder=true`, { waitUntil: "networkidle0" });
  } else {
    await page.goto(`http://localhost:3000/invoice/${id}`, { waitUntil: "networkidle0" });
  }

  const pdf = await page.pdf({
    format: "A4", printBackground: true
  });

  await browser.close();
  return pdf;
}
