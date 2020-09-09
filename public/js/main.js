(function () {
  bindEventListeners();

  let reminderCb = document.querySelector("#reminderCb");

  if (reminderCb) {
    reminderCb.addEventListener("input", event => {
      if (document.querySelector("#reminderCb").checked) {
        document.querySelector("#reminderCbHidden").disabled = true;
      }
    });
  }

  let vatDropdown = document.querySelector("#vatDropdown");

  if (vatDropdown) {
    let vat = vatDropdown.dataset.option;
    vatDropdown.value = vat;
  }

  let invoiceTableRows = document.querySelectorAll(".invoice_table_row");

  if (invoiceTableRows.length) {
    invoiceTableRows.forEach(row => {
      row.addEventListener("click", event => {
        let href = row.dataset.href;
        window.location = href;
      });
    });
  }



})();

function bindEventListeners() {
  let addMatBtn = document.querySelector("#addMaterial");
  let matUl = document.querySelector("ul.materials");
  if (addMatBtn && matUl) {
    addMatBtn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      let node = document.createElement("li");
      node.innerHTML = "<input class='material' type='text' name='materials[name]' placeholder='materiaal'> <input class='price' type='text' name='materials[price]' placeholder='prijs'> <button class='removeMaterial'>-</button>";
      matUl.appendChild(node);
      bindEventListeners();
    });
  }

  let removeMatBtns = document.querySelectorAll("button.removeMaterial");
  if (removeMatBtns.length) {
    removeMatBtns.forEach(rmb => {
      rmb.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        rmb.parentNode.remove();
      });
    });
  }
}