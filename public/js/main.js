(function () {

  let reminderCb = document.querySelector("#reminderCb");

  if (reminderCb) {
    reminderCb.addEventListener("input", event => {
      if (document.querySelector("#reminderCb").checked) {
        document.querySelector("#reminderCbHidden").disabled = true;
      }
    });
  }

})();
