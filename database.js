const connection = require("./db");
const currency = require("currency.js");
const { YYYYMMDDToDDMMYYYY } = require("./util");

async function query(queryString) {
  return new Promise((resolve, reject) => {
    connection.query(queryString, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function queryO(queryString, queryOptions) {
  return new Promise((resolve, reject) => {
    connection.query(queryString, queryOptions, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function addInvoiceToDb(body) {
  let { invoice_number, name, address, postal, date, enddate, description, hours, hourly, materials, vat, staticPriceSubtotal } = body;

  //only add if unique id
  let idExists = await query(`SELECT * FROM invoice WHERE invoiceNumber = ${invoice_number}`);
  if (idExists.length) return false;

  date = YYYYMMDDToDDMMYYYY(date);
  enddate = YYYYMMDDToDDMMYYYY(enddate);

  try {
    if (staticPriceSubtotal) {
      //no hours, no hourly, no materials -> only (passed in subtotal / 100) * vat
      let { vatPrice, total } = getInvoicePriceStatic(staticPriceSubtotal, vat);
      connection.query(`INSERT INTO invoice (invoiceNumber, name, address, postal, date, enddate, description, vat, subtotal, vatPrice, total) VALUES ('${invoice_number}', ${connection.escape(name)}, ${connection.escape(address)}, ${connection.escape(postal)}, '${date}', '${enddate}', ${connection.escape(description)}, '${vat}', '${staticPriceSubtotal}', '${vatPrice}', '${total}');`, (err, result) => {
        if (err) console.log(err);
      });
    } else {
      let { hoursPrice, subtotal, vatPrice, total } = getInvoicePriceHours(hours, hourly, materials, vat);
      // add to invoice table
      connection.query(`INSERT INTO invoice (invoiceNumber, name, address, postal, date, enddate, description, hours, hourly, vat, hoursPrice, subtotal, vatPrice, total) VALUES ('${invoice_number}', ${connection.escape(name)}, ${connection.escape(address)}, ${connection.escape(postal)}, '${date}', '${enddate}', ${connection.escape(description)}, '${hours}', '${hourly}', '${vat}', ${hoursPrice}, '${subtotal}', '${vatPrice}', '${total}');`, (err, result) => {
        if (err) console.log(err);
      });
    }
    if (materials) {
      updateMaterials(invoice_number, materials);
    }
  } catch (err) {
    if (err) throw err;
  }

  return true;
}

async function updateInvoice(body, callback) {
  let { id, invoice_number, name, address, postal, date, enddate, description, hours, hourly, materials, vat, staticPriceSubtotal } = body;

  date = YYYYMMDDToDDMMYYYY(date);
  enddate = YYYYMMDDToDDMMYYYY(enddate);

  try {
    //old invoice number (if changed), need it to delete potential materials from old invoice id
    let row = await query(`SELECT * FROM invoices.invoice WHERE id = ${id}`);
    let oldInvoiceNumber = row[0].invoiceNumber;
    if (staticPriceSubtotal) {
      //no hours, no hourly, no materials -> only (passed in subtotal / 100) * vat
      let { vatPrice, total } = getInvoicePriceStatic(staticPriceSubtotal, vat);
      await queryO("UPDATE invoice SET ?  WHERE ?", [{ invoiceNumber: invoice_number, name, address, postal, date, enddate, description, hours: "0", hourly: "0", vat, hoursPrice: "0", subtotal: (Math.round(staticPriceSubtotal * 100) / 100).toFixed(2), vatPrice, total }, { id }]);
    } else {
      let { hoursPrice, subtotal, vatPrice, total } = getInvoicePriceHours(hours, hourly, materials, vat);

      await queryO("UPDATE invoice SET ?  WHERE ?", [{ invoiceNumber: invoice_number, name, address, postal, date, enddate, description, hours, hourly, vat, hoursPrice, subtotal, vatPrice, total }, { id }]);
      await deleteOldMaterials(oldInvoiceNumber);
      await deleteMaterials(invoice_number);
      if (materials.name.length) {
        await updateMaterials(invoice_number, materials);
      }
    }
    callback();
  } catch (err) {
    if (err) throw err;
  }
}

async function deleteMaterials(invoiceId) {
  let materials = await query(`SELECT materials.* FROM invoice INNER JOIN invoice_materials im ON im.invoice_id = invoice.invoiceNumber INNER JOIN materials ON im.materials_id = materials.id AND invoice.invoiceNumber = ${invoiceId}`);

  if (materials.length) {
    materials.forEach(async (mat) => {
      await query(`DELETE m, im FROM materials m JOIN invoice_materials im ON im.materials_id = m.id AND m.id = ${mat.id}`);
    });
  }
}

async function deleteOldMaterials(invoiceId) {
  let materials = await query(`SELECT * FROM invoices.invoice_materials WHERE invoice_materials.invoice_id = ${invoiceId}`);

  if (materials.length) {
    materials.forEach(async (mat) => {
      await query(`DELETE FROM invoices.invoice_materials WHERE invoice_materials.invoice_id = ${invoiceId}`);
      await query(`DELETE FROM invoices.materials WHERE materials.id = ${mat.materials_id}`);
    });
  }

}

async function updateMaterials(invoiceId, materials) {
  let nMaterials = materials.name.length;

  try {
    for (let i = 0; i < nMaterials; i++) {
      if (materials.name[i].trim() == "") continue;

      //add each material to materials table, store the id it got given
      let { insertId } = await query(`INSERT INTO materials (name, price) VALUES ('${materials.name[i]}', '${materials.price[i]}')`);
      //link invoice with materials
      await query(`INSERT INTO invoice_materials (invoice_id, materials_id) VALUES ('${invoiceId}', '${insertId}')`);
    }
  } catch (err) {
    if (err) throw err;
  }
}

function getInvoicePriceHours(hours, hourly, materials, vat) {
  let hoursPrice = hours * hourly;

  let currency_hoursPrice = currency(hoursPrice);
  currency_hoursPrice = (Math.round(currency_hoursPrice.value * 100) / 100).toFixed(2);
  // console.log(`hours: ${currency_hoursPrice.value} ========== (${hours} * ${hourly})`);

  let matsPrice = 0;
  if (Array.isArray(materials.name)) {
    let currency_array = materials.price.map(price => currency(price).value);
    matsPrice = currency_array.reduce((acc, currentValue) => acc + currentValue);
  }

  // console.log(`materials: ${matsPrice} ========== (${materials.price})`);
  let subtotal = currency(currency_hoursPrice).add(matsPrice);
  subtotal = (Math.round(subtotal.value * 100) / 100).toFixed(2);

  // console.log(`subtotal: ${subtotal.value} ========== (${currency_hoursPrice.value} + ${matsPrice})`);

  let vatPrice = currency((subtotal / 100) * parseInt(vat));
  vatPrice = (Math.round(vatPrice.value * 100) / 100).toFixed(2);
  // console.log(`vat: ${vatPrice.value} ========== ((${subtotal}/100) * ${vat})`);

  let total = currency(subtotal).add(vatPrice);
  total = (Math.round(total.value * 100) / 100).toFixed(2); //force 2 decimals even if even number
  // console.log(`total: ${total.value} ========== (${subtotal.value} + ${vatPrice.value})`);

  return { hoursPrice: currency_hoursPrice, subtotal, vatPrice, total };
}

function getInvoicePriceStatic(subtotal, vat) {
  let vatPrice = currency((subtotal / 100) * parseInt(vat));
  vatPrice = (Math.round(vatPrice.value * 100) / 100).toFixed(2);
  // console.log(`vat: ${vatPrice.value} ========== ((${subtotal}/100) * ${vat})`);

  let total = currency(subtotal).add(vatPrice);
  total = (Math.round(total.value * 100) / 100).toFixed(2); //force 2 decimals even if even number
  // console.log(`total: ${total.value} ========== (${subtotal.value} + ${vatPrice.value})`);

  return { vatPrice, total };
}

module.exports = { query, updateInvoice, addInvoiceToDb };