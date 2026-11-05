(function () {
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  function setMenu(open) {
    if (!toggle || !nav) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.textContent = open ? "Close" : "Menu";
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = !nav.classList.contains("is-open");
      setMenu(open);
      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus();
      }
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  var form = document.getElementById("quote-form");
  if (!form) return;

  var confirmation = document.getElementById("confirmation");
  var alertBox = document.getElementById("form-alert");
  var summary = document.getElementById("confirmation-summary");
  var lead = document.getElementById("confirmation-lead");
  var copyButton = document.getElementById("copy-summary");
  var editButton = document.getElementById("edit-request");
  var copyStatus = document.getElementById("copy-status");
  var dateInput = document.getElementById("event-date");
  var attempted = false;

  var fields = {
    name: document.getElementById("name"),
    company: document.getElementById("company"),
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    date: dateInput,
    venue: document.getElementById("venue"),
    guests: document.getElementById("guests"),
    message: document.getElementById("message"),
    items: document.getElementById("items-group")
  };

  function isoToday() {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  if (dateInput) dateInput.min = isoToday();

  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    var parts = value.split("-");
    var yearNum = Number(parts[0]);
    var monthNum = Number(parts[1]);
    var dayNum = Number(parts[2]);
    var date = new Date(yearNum, monthNum - 1, dayNum);
    if (
      date.getFullYear() !== yearNum ||
      date.getMonth() !== monthNum - 1 ||
      date.getDate() !== dayNum
    ) {
      return null;
    }
    return date;
  }

  function formatDate(value) {
    var date = parseDate(value);
    if (!date) return value;
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

  function setFieldError(id, message) {
    var error = document.getElementById(id + "-error");
    var field = document.getElementById(id);
    if (!error || !field) return;
    error.textContent = message || "";
    if (message) {
      field.setAttribute("aria-invalid", "true");
      if (!field.getAttribute("aria-describedby")) {
        field.setAttribute("aria-describedby", error.id);
      }
    } else {
      field.removeAttribute("aria-invalid");
    }
  }

  function selectedItems() {
    return Array.prototype.slice
      .call(form.querySelectorAll('input[name="items"]:checked'))
      .map(function (input) {
        return input.value;
      });
  }

  function validate(options) {
    var errors = [];
    var name = fields.name.value.trim();
    var company = fields.company.value.trim();
    var email = fields.email.value.trim();
    var phone = fields.phone.value.trim();
    var venue = fields.venue.value.trim();
    var message = fields.message.value.trim();
    var guestsRaw = fields.guests.value.trim();
    var dateValue = fields.date.value;
    var items = selectedItems();

    if (name.length < 2) errors.push({ id: "name", message: "Enter your name." });
    if (company.length < 2) errors.push({ id: "company", message: "Enter your company." });

    if (!email) {
      errors.push({ id: "email", message: "Enter your email." });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      errors.push({ id: "email", message: "Enter a valid email address." });
    }

    var phoneDigits = phone.replace(/\D/g, "");
    if (phone && phoneDigits.length < 7) {
      errors.push({
        id: "phone",
        message: "Enter a phone number with at least 7 digits, or leave it blank."
      });
    }

    var eventDate = parseDate(dateValue);
    var today = parseDate(isoToday());
    if (!dateValue) {
      errors.push({ id: "event-date", message: "Enter the event date." });
    } else if (!eventDate) {
      errors.push({ id: "event-date", message: "Enter a valid event date." });
    } else if (eventDate < today) {
      errors.push({ id: "event-date", message: "Enter a date today or later." });
    } else {
      var limit = new Date(today.getFullYear() + 5, today.getMonth(), today.getDate());
      if (eventDate > limit) {
        errors.push({ id: "event-date", message: "Enter a date within the next five years." });
      }
    }

    if (venue.length < 2) errors.push({ id: "venue", message: "Enter the venue or city." });

    if (!/^\d+$/.test(guestsRaw) || Number(guestsRaw) < 1 || Number(guestsRaw) > 100000) {
      errors.push({ id: "guests", message: "Enter the number of guests you expect." });
    }

    if (!items.length) {
      errors.push({ id: "items-group", message: "Select at least one item." });
    }

    if (message.length > 2000) {
      errors.push({ id: "message", message: "Keep the message under 2,000 characters." });
    }

    ["name", "company", "email", "phone", "event-date", "venue", "guests", "items-group", "message"].forEach(
      function (id) {
        var match = errors.find(function (item) {
          return item.id === id;
        });
        setFieldError(id, match ? match.message : "");
      }
    );

    if (errors.length) {
      alertBox.hidden = false;
      alertBox.replaceChildren();
      var heading = document.createElement("p");
      heading.textContent = "Check the highlighted fields.";
      var list = document.createElement("ul");
      errors.forEach(function (item) {
        var li = document.createElement("li");
        var link = document.createElement("a");
        link.href = "#" + item.id;
        link.textContent = item.message;
        li.appendChild(link);
        list.appendChild(li);
      });
      alertBox.append(heading, list);
      if (options.focus) alertBox.focus();
      return null;
    }

    alertBox.hidden = true;
    alertBox.replaceChildren();
    return {
      name: name,
      company: company,
      email: email,
      phone: phone,
      date: dateValue,
      venue: venue,
      guests: guestsRaw,
      items: items,
      message: message
    };
  }

  function summaryLines(data) {
    return [
      ["Name", data.name],
      ["Company", data.company],
      ["Email", data.email],
      ["Phone", data.phone || "Not provided"],
      ["Event date", formatDate(data.date)],
      ["Venue/City", data.venue],
      ["Expected guests", data.guests],
      ["Items of interest", data.items.join(", ")],
      ["Message", data.message || "Not provided"]
    ];
  }

  function summaryText(data) {
    var lines = summaryLines(data).map(function (row) {
      return row[0] + ": " + row[1];
    });
    return ["Brand Image Live — quote request", "Not sent. Saved from this page.", ""].concat(lines).join("\n");
  }

  function showConfirmation(data) {
    lead.textContent = "Thank you, " + data.name + ". Your quote request is confirmed.";
    summary.replaceChildren();
    summaryLines(data).forEach(function (row) {
      var wrap = document.createElement("div");
      var term = document.createElement("dt");
      var detail = document.createElement("dd");
      term.textContent = row[0];
      detail.textContent = row[1];
      wrap.append(term, detail);
      summary.appendChild(wrap);
    });
    form.hidden = true;
    confirmation.hidden = false;
    confirmation.dataset.summary = summaryText(data);
    confirmation.focus();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    attempted = true;
    var data = validate({ focus: true });
    if (data) showConfirmation(data);
  });

  form.addEventListener("input", function () {
    if (attempted) validate({ focus: false });
  });

  if (copyButton) {
    copyButton.addEventListener("click", function () {
      var text = confirmation.dataset.summary || "";
      function copied() {
        copyButton.textContent = "Copied";
        if (copyStatus) copyStatus.textContent = "Summary copied.";
        window.setTimeout(function () {
          copyButton.textContent = "Copy summary";
          if (copyStatus) copyStatus.textContent = "";
        }, 2000);
      }
      function failed() {
        if (copyStatus) copyStatus.textContent = "Copy was not available. Select the summary and copy it.";
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(copied).catch(function () {
          fallbackCopy(text) ? copied() : failed();
        });
      } else if (!fallbackCopy(text)) {
        failed();
      } else {
        copied();
      }
    });
  }

  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (error) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }

  if (editButton) {
    editButton.addEventListener("click", function () {
      confirmation.hidden = true;
      form.hidden = false;
      fields.name.focus();
    });
  }
})();
