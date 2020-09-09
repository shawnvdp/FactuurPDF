const connection = require("./db");

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
  let { invoice_number, name, address, postal, date, enddate, description, hours, hourly, materials, vat, reminder } = body;

  //only add if unique id
  let idExists = await query(`SELECT * FROM invoice WHERE id = ${invoice_number}`);
  if (idExists.length) return false;

  try {
    // add to invoice table
    await query(`INSERT INTO invoice (id, name, address, postal, date, enddate, description, hours, hourly, vat) VALUES ('${invoice_number}', '${name}', '${address}', '${postal}', '${date}', '${enddate}', '${description}', '${hours}', '${hourly}', '${vat}');`);

    updateMaterials(invoice_number, materials);
  } catch (err) {
    if (err) throw err;
  }

  return true;
}

// DELETE p, pa
// FROM pets p
// JOIN pets_activities pa ON pa.id = p.pet_id
// WHERE p.order > :order
// AND p.pet_id = :pet_id

async function updateInvoice(body) {
  let { invoice_number, name, address, postal, date, enddate, description, hours, hourly, materials, vat } = body;

  try {
    await queryO("UPDATE invoice SET ?  WHERE ?", [{ name, address, postal, date, enddate, description, hours, hourly, vat }, { id: invoice_number }]);
    await deleteMaterials(invoice_number);
    await updateMaterials(invoice_number, materials);
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
  let nMaterials = materials.name.length;

  try {
    for (let i = 0; i < nMaterials; i++) {
      //add each material to materials table, store the id it got given
      let { insertId } = await query(`INSERT INTO materials (name, price) VALUES ('${materials.name[i]}', '${materials.price[i]}')`);
      //link invoice with materials
      await query(`INSERT INTO invoice_materials (invoice_id, materials_id) VALUES ('${invoiceId}', '${insertId}')`);
    }
  } catch (err) {
    if (err) throw err;
  }
}

module.exports = { query, updateInvoice, addInvoiceToDb };