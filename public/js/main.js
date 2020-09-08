(function () {

  let reminderCb = document.querySelector("#reminderCb");

  if (reminderCb) {
    reminderCb.addEventListener("input", event => {
      if (document.querySelector("#reminderCb").checked) {
        document.querySelector("#reminderCbHidden").disabled = true;
      }
    });
  }



  // let formData = {};

  // let dataFields = document.querySelectorAll(".data");

  // dataFields.forEach(df => {
  //   df.addEventListener("input", event => {
  //     let name = df.getAttribute("name");
  //     let value = df.value;

  //     //reminder checkbox
  //     if (df.getAttribute("type") == "checkbox") {
  //       value = df.checked;
  //     }

  //     if (formData[name] == undefined) {
  //       formData[name] = {};
  //     }
  //     formData[name] = value;

  //   });
  // });

  // let materials = document.querySelectorAll("ul.materials li");
  // if (materials.length) {
  //   formData.materials = [];

  //   materials.forEach((li, index) => {
  //     let materialInput = li.children[0];
  //     let priceInput = li.children[1];


  //     materialInput.addEventListener("input", event => {
  //       let material = materialInput.value;
  //       if (formData.materials[index] == undefined) {
  //         formData.materials[index] = {};
  //       }
  //       formData.materials[index].material = material;

  //     });

  //     priceInput.addEventListener("input", event => {
  //       let price = priceInput.value;
  //       if (formData.materials[index] == undefined) {
  //         formData.materials[index] = {};
  //       }
  //       formData.materials[index].price = price;

  //     });
  //   });
  // }


})();
