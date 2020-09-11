function YYYYMMDDToDDMMYYYY(date) {
  let splits = date.split("-");
  let formattedDate = `${splits[2]}-${splits[1]}-${splits[0]}`;

  return formattedDate;
}

function DDMMYYYYToYYYYMMDD(date) {
  let splits = date.split("-");
  let formattedDate = `${splits[2]}-${splits[1]}-${splits[0]}`;

  return formattedDate;
}

function formatInvoiceId(id) {
  let formattedId = "";
  let desiredLength = 9;

  for (let i = 0; i < desiredLength - id.toString().length; i++) {
    formattedId += "0";
  }
  formattedId += id;

  return formattedId;
}

module.exports = { YYYYMMDDToDDMMYYYY, DDMMYYYYToYYYYMMDD, formatInvoiceId };