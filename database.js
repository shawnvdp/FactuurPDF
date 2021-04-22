const dbconnection = require("./dbconnection");

class Database {
  constructor() {
    this.connection = dbconnection;
    this.connection.connect();
  }

  async query(queryString) {
    return new Promise((resolve, reject) => {
      this.connection.query(queryString, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async getAllInvoices() {
    const invoices = await this.query("SELECT * FROM invoice ORDER BY invoiceNumber");
    return invoices;
  }

  async getInvoiceByNumber(number) {
    const invoice = await this.query(`SELECT * FROM invoices.invoice WHERE invoiceNumber = ${number}`);

    if (!invoice.length) {
      return null;
    }

    return invoice;
  }

  async getInvoiceMaterialsByNumber(number) {
    const materials = await this.query(`SELECT materials.* FROM invoice INNER JOIN invoice_materials im ON im.invoice_id = invoice.invoiceNumber INNER JOIN materials ON im.materials_id = materials.id AND invoice.invoiceNumber = ${number}`);

    if (!materials.length) {
      return null;
    }

    return materials;
  }
  
  async doesInvoiceExistWithNumber(number) {
    const result = await this.query(`SELECT * FROM invoice WHERE invoiceNumber = ${number}`);

    return result.length > 1;
  }

  // async createNewInvoice(body) {
  //   let { invoice_number, name, address, postal, date, enddate, description, hours, hourly, materials, vat, staticPriceSubtotal } = body;

  //   const invoiceExists = this.doesInvoiceExistWithNumber(invoice_number);

  //   if (invoiceExists) {
  //     console.log(`invoice with ${invoice_number} already exists`);
  //     return false;
  //   }

  //   date = YYYYMMDDToDDMMYYYY(date);
  //   enddate = YYYYMMDDToDDMMYYYY(enddate);


  // }

  // async createMaterialsForInvoiceNumber(number) {

  // }
}

module.exports = Database;