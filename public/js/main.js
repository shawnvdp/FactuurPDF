(function () {

  let formData = JSON.parse(localStorage.getItem("formData")) || {};
  formData.materials = [];

  let dataFields = document.querySelectorAll(".data");

  dataFields.forEach(df => {
    df.addEventListener("input", event => {
      let name = df.getAttribute("name");
      let value = df.value;

      //reminder checkbox
      if (df.getAttribute("type") == "checkbox") {
        value = df.checked;
      }

      if (formData[name] == undefined) {
        formData[name] = {};
      }
      formData[name] = value;

      updateLocalStorage();
      // localStorage.setItem(name, value);
    });
  });

  let materialsObject = JSON.parse(localStorage.getItem("materials")) || {};

  let materials = document.querySelectorAll("ul.materials li");
  if (materials.length) {
    materials.forEach((li, index) => {
      let materialInput = li.children[0];
      let priceInput = li.children[1];


      materialInput.addEventListener("input", event => {
        let material = materialInput.value;
        if (formData.materials[index] == undefined) {
          formData.materials[index] = {};
        }
        formData.materials[index].material = material;

        updateLocalStorage();
        // localStorage.setItem("materials", JSON.stringify(materialsObject));
      });

      priceInput.addEventListener("input", event => {
        let price = priceInput.value;
        if (formData.materials[index] == undefined) {
          formData.materials[index] = {};
        }
        formData.materials[index].price = price;

        updateLocalStorage();
        // localStorage.setItem("materials", JSON.stringify(materialsObject));
      });
    });
  }


  function updateLocalStorage() {
    localStorage.setItem("formData", JSON.stringify(formData));
  }


})();
