(function () {
  bindEventListeners();

  let staticPriceCb = document.querySelector("#staticPriceCb");

  if (staticPriceCb) {
    staticPriceCb.addEventListener("input", event => {
      document.querySelector("#staticPrice").disabled = !staticPriceCb.checked;
      document.querySelectorAll(".disable_for_static").forEach(input => {
        input.disabled = staticPriceCb.checked;
      });
    });
  }

  let vatDropdown = document.querySelector("#vatSelect");

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

{/* <li id="validationDefault08" class="col-md-12 mb-3">
  <div class="form-row">
    <div class="col-md-6">
      <input class="form-control material disable_for_static" type="text" name="materials[name]" placeholder="Materiaal naam">
    </div>
    <div class="col-md-6">
      <input class="form-control price disable_for_static" type="text" name="materials[price]" placeholder="Materiaal prijs">
    </div>
  </div>
</li> */}

function bindEventListeners() {
  let addMatBtn = document.querySelector("#addMaterial");
  let matUl = document.querySelector("ul.materials");
  if (addMatBtn && matUl) {
    addMatBtn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      let node = document.createElement("li");
      node.classList.add("col-md-12", "mb-1");
      node.innerHTML = `<div class="form-row">
                          <div class="col-md-6">
                            <input class="form-control material disable_for_static" type="text" name="materials[name]" placeholder="Materiaal naam">
                          </div>
                          <div class="col-md-6">
                            <input class="form-control price disable_for_static" type="text" name="materials[price]" placeholder="Materiaal prijs">
                          </div>
                        </div>`;
      matUl.appendChild(node);
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