const connection = require("./db");
const currency = require("currency.js");
const { static } = require("express");

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
  let { invoice_number, name, address, postal, date, enddate, description, hours, hourly, materials, vat, staticPriceSubtotal, reminder } = body;

  //only add if unique id
  let idExists = await query(`SELECT * FROM invoice WHERE id = ${invoice_number}`);
  if (idExists.length) return false;

  try {
    if (staticPriceSubtotal) {
      //no hours, no hourly, no materials -> only (passed in subtotal / 100) * vat
      let { vatPrice, total } = getInvoicePriceStatic(staticPriceSubtotal, vat);
      await query(`INSERT INTO invoice (id, name, address, postal, date, enddate, description, vat, subtotal, vatPrice, total) VALUES ('${invoice_number}', '${name}', '${address}', '${postal}', '${date}', '${enddate}', '${description}', '${vat}', '${staticPriceSubtotal}', '${vatPrice}', '${total}');`);
    } else {
      let { hoursPrice, subtotal, vatPrice, total } = getInvoicePriceHours(hours, hourly, materials, vat);
      // add to invoice table
      await query(`INSERT INTO invoice (id, name, address, postal, date, enddate, description, hours, hourly, vat, hoursPrice, subtotal, vatPrice, total) VALUES ('${invoice_number}', '${name}', '${address}', '${postal}', '${date}', '${enddate}', '${description}', '${hours}', '${hourly}', '${vat}', ${hoursPrice}, '${subtotal}', '${vatPrice}', '${total}');`);
    }

    updateMaterials(invoice_number, materials);
  } catch (err) {
    if (err) throw err;
  }

  return true;
}

async function updateInvoice(body) {
  let { invoice_number, name, address, postal, date, enddate, description, hours, hourly, materials, vat, staticPriceSubtotal } = body;

  try {
    if (staticPriceSubtotal) {
      //no hours, no hourly, no materials -> only (passed in subtotal / 100) * vat
      let { vatPrice, total } = getInvoicePriceStatic(staticPriceSubtotal, vat);
      await queryO("UPDATE invoice SET ?  WHERE ?", [{ name, address, postal, date, enddate, description, vat, subtotal: staticPriceSubtotal, vatPrice, total }, { id: invoice_number }]);
    } else {
      let { hoursPrice, subtotal, vatPrice, total } = getInvoicePriceHours(hours, hourly, materials, vat);

      await queryO("UPDATE invoice SET ?  WHERE ?", [{ name, address, postal, date, enddate, description, hours, hourly, vat, hoursPrice, subtotal, vatPrice, total }, { id: invoice_number }]);
      await deleteMaterials(invoice_number);
      await updateMaterials(invoice_number, materials);
    }
  } catch (err) {
    if (err) throw err;
  }
}

async function deleteMaterials(invoiceId) {
  let materials = await query(`SELECT materials.* FROM invoice INNER JOIN invoice_materials im ON im.invoice_id = invoice.id INNER JOIN materials ON im.materials_id = materials.id AND invoice.id = ${invoiceId}`);

  if (materials.length) {
    materials.forEach(async (mat) => {
      await query(`DELETE m, im FROM materials m JOIN invoice_materials im ON im.materials_id = m.id AND m.id = ${mat.id}`);
    });
  }
}

async function updateMaterials(invoiceId, materials) {
  //materials.name and materials.price is an array of objects if invoice has > 1 materials, otherwise its an object
  const isArray = Array.isArray(materials.name);
  let nMaterials;

  if (Array.isArray(materials.name)) {
    //iter over length of array
    nMaterials = materials.name.length;
  } else {
    //if not array and materials.name is defined, it HAS to be just 1 material with invoice
    if (materials.name)
      nMaterials = 1;
  }

  try {
    for (let i = 0; i < nMaterials; i++) {
      if (isArray) {
        if (materials.name[i].trim() == "") continue;
      } else {
        if (materials.name.trim() == "") continue;
      }

      //add each material to materials table, store the id it got given
      //materials.name = array if invoice has > 1 materials, otherwise its the string of the single material
      let { insertId } = await query(`INSERT INTO materials (name, price) VALUES ('${isArray ? materials.name[i] : materials.name}', '${isArray ? materials.price[i] : materials.price}')`);
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
  // console.log(`hours: ${currency_hoursPrice.value} ========== (${hours} * ${hourly})`);

  //1 material = object, > 1 materials = array
  let currency_array;
  let matsPrice;
  if (Array.isArray(materials.price)) {
    currency_array = materials.price.map(price => currency(price).value);
    matsPrice = currency_array.reduce((acc, currentValue) => acc + currentValue);
  }

  // console.log(`materials: ${matsPrice} ========== (${materials.price})`);
  let subtotal;
  if (typeof matsPrice == undefined) {
    subtotal = currency_hoursPrice.add(materials.price);
  } else {
    subtotal = currency_hoursPrice.add(matsPrice);
  }
  // console.log(`subtotal: ${subtotal.value} ========== (${currency_hoursPrice.value} + ${matsPrice})`);

  let vatPrice = currency((subtotal / 100) * parseInt(vat));
  // console.log(`vat: ${vatPrice.value} ========== ((${subtotal}/100) * ${vat})`);

  let total = subtotal.add(vatPrice);
  // console.log(`total: ${total.value} ========== (${subtotal.value} + ${vatPrice.value})`);

  return { hoursPrice: currency_hoursPrice.value, subtotal: subtotal.value, vatPrice: vatPrice.value, total: total.value };
}

function getInvoicePriceStatic(subtotal, vat) {
  let vatPrice = currency((subtotal / 100) * parseInt(vat));
  // console.log(`vat: ${vatPrice.value} ========== ((${subtotal}/100) * ${vat})`);

  let total = currency(subtotal).add(vatPrice);
  // console.log(`total: ${total.value} ========== (${subtotal.value} + ${vatPrice.value})`);

  return { vatPrice: vatPrice.value, total: total.value };
}

module.exports = { query, updateInvoice, addInvoiceToDb };