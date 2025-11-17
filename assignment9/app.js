const API_BASE = "https://691515a384e8bd126af891e4.mockapi.io";
const BOOKS_URL = API_BASE + "/books";

window.addEventListener("DOMContentLoaded", function () {
  const page = document.body.dataset.page;
  if (page === "index") {
    loadIndex();
  } else if (page === "detail") {
    loadDetail();
  } else if (page === "create") {
    initCreate();
  } else if (page === "edit") {
    initEdit();
  }
});

// ----------------- INDEX -----------------

function loadIndex() {
  const listElement = document.getElementById("book-list");
  const messageElement = document.getElementById("list-message");
  messageElement.textContent = "Loading books...";

  fetch(BOOKS_URL)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load data");
      }
      return response.json();
    })
    .then(function (data) {
      messageElement.textContent = "";
      listElement.innerHTML = "";
      if (!Array.isArray(data) || data.length === 0) {
        messageElement.textContent = "No books found.";
        return;
      }

      data.forEach(function (book) {
        const li = document.createElement("li");

        const infoWrapper = document.createElement("div");
        const link = document.createElement("a");
        link.href = "detail.html?id=" + book.id;
        link.textContent = book.title || "Untitled book";
        const meta = document.createElement("span");
        meta.textContent = book.author ? " by " + book.author : "";
        infoWrapper.appendChild(link);
        infoWrapper.appendChild(meta);

        const actionsWrapper = document.createElement("div");

        const editLink = document.createElement("a");
        editLink.href = "edit.html?id=" + book.id;
        editLink.textContent = "Edit";
        editLink.className = "button secondary";
        actionsWrapper.appendChild(editLink);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "button danger";
        deleteButton.addEventListener("click", function () {
          handleDelete(book.id);
        });
        actionsWrapper.appendChild(deleteButton);

        li.appendChild(infoWrapper);
        li.appendChild(actionsWrapper);
        listElement.appendChild(li);
      });
    })
    .catch(function () {
      messageElement.textContent = "Error loading books from API.";
    });
}

function handleDelete(id) {
  const confirmed = window.confirm("Are you sure you want to delete this?");
  if (!confirmed) {
    return;
  }

  fetch(BOOKS_URL + "/" + encodeURIComponent(id), {
    method: "DELETE"
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to delete book");
      }
      return response.json();
    })
    .then(function () {
      window.location.reload();
    })
    .catch(function () {
      alert("Error deleting book via API.");
    });
}

// ----------------- DETAIL -----------------

function loadDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const messageElement = document.getElementById("detail-message");
  const contentElement = document.getElementById("detail-content");

  if (!id) {
    messageElement.textContent = "No book id provided.";
    return;
  }

  messageElement.textContent = "Loading book...";
  fetch(BOOKS_URL + "/" + encodeURIComponent(id))
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load book");
      }
      return response.json();
    })
    .then(function (book) {
      messageElement.textContent = "";
      contentElement.innerHTML = "";

      addDetailRow(contentElement, "Title", book.title);
      addDetailRow(contentElement, "Author", book.author);
      addDetailRow(contentElement, "Publisher", book.publisher);
      addDetailRow(contentElement, "Year", book.year);
      addDetailRow(contentElement, "Pages", book.pages);
      addDetailRow(contentElement, "ID", book.id);
    })
    .catch(function () {
      messageElement.textContent = "Error loading book from API.";
    });
}

function addDetailRow(container, label, value) {
  const dt = document.createElement("dt");
  dt.textContent = label;
  const dd = document.createElement("dd");
  dd.textContent =
    value !== undefined && value !== null && value !== "" ? value : "-";
  container.appendChild(dt);
  container.appendChild(dd);
}

// ----------------- CREATE -----------------

function initCreate() {
  const form = document.getElementById("create-form");
  const messageElement = document.getElementById("create-message");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors();
    messageElement.textContent = "";
    messageElement.className = "message";

    const titleValue = document.getElementById("title").value.trim();
    const authorValue = document.getElementById("author").value.trim();
    const publisherValue = document
      .getElementById("publisher")
      .value.trim();
    const yearValue = document.getElementById("year").value.trim();
    const pagesValue = document.getElementById("pages").value.trim();

    let valid = true;
    const currentYear = new Date().getFullYear();

    if (!titleValue) {
      showError("title-error", "Title is required.");
      valid = false;
    }
    if (!authorValue) {
      showError("author-error", "Author is required.");
      valid = false;
    }
    if (!publisherValue) {
      showError("publisher-error", "Publisher is required.");
      valid = false;
    }

    const year = parseInt(yearValue, 10);
    if (!yearValue) {
      showError("year-error", "Year is required.");
      valid = false;
    } else if (isNaN(year) || year < 1800 || year > currentYear) {
      showError(
        "year-error",
        "Enter a valid year between 1800 and " + currentYear + "."
      );
      valid = false;
    }

    const pages = parseInt(pagesValue, 10);
    if (!pagesValue) {
      showError("pages-error", "Pages is required.");
      valid = false;
    } else if (isNaN(pages) || pages <= 0) {
      showError("pages-error", "Pages must be a positive number.");
      valid = false;
    }

    if (!valid) {
      messageElement.textContent = "Please fix the errors above.";
      messageElement.classList.add("error");
      return;
    }

    const payload = {
      title: titleValue,
      author: authorValue,
      publisher: publisherValue,
      year: year,
      pages: pages
    };

    messageElement.textContent = "Submitting...";
    fetch(BOOKS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed to create book");
        }
        return response.json();
      })
      .then(function () {
        messageElement.textContent =
          "Book created successfully. Redirecting to homepage...";
        messageElement.classList.add("success");
        setTimeout(function () {
          window.location.href = "index.html";
        }, 1200);
      })
      .catch(function () {
        messageElement.textContent = "Error creating book via API.";
        messageElement.classList.add("error");
      });
  });
}

// ----------------- EDIT -----------------

function initEdit() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const messageElement = document.getElementById("edit-message");
  const form = document.getElementById("edit-form");

  if (!id) {
    messageElement.textContent = "No book id provided.";
    messageElement.classList.add("error");
    return;
  }

  const hiddenIdInput = document.getElementById("book-id");
  if (hiddenIdInput) {
    hiddenIdInput.value = id;
  }

  messageElement.textContent = "Loading book...";
  messageElement.className = "message";

  fetch(BOOKS_URL + "/" + encodeURIComponent(id))
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load book");
      }
      return response.json();
    })
    .then(function (book) {
      messageElement.textContent = "";

      document.getElementById("title").value = book.title || "";
      document.getElementById("author").value = book.author || "";
      document.getElementById("publisher").value = book.publisher || "";
      document.getElementById("year").value =
        book.year !== undefined && book.year !== null ? book.year : "";
      document.getElementById("pages").value =
        book.pages !== undefined && book.pages !== null ? book.pages : "";
    })
    .catch(function () {
      messageElement.textContent = "Error loading book from API.";
      messageElement.classList.add("error");
    });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors();
    messageElement.textContent = "";
    messageElement.className = "message";

    const titleValue = document.getElementById("title").value.trim();
    const authorValue = document.getElementById("author").value.trim();
    const publisherValue = document
      .getElementById("publisher")
      .value.trim();
    const yearValue = document.getElementById("year").value.trim();
    const pagesValue = document.getElementById("pages").value.trim();

    let valid = true;
    const currentYear = new Date().getFullYear();

    if (!titleValue) {
      showError("title-error", "Title is required.");
      valid = false;
    }
    if (!authorValue) {
      showError("author-error", "Author is required.");
      valid = false;
    }
    if (!publisherValue) {
      showError("publisher-error", "Publisher is required.");
      valid = false;
    }

    const year = parseInt(yearValue, 10);
    if (!yearValue) {
      showError("year-error", "Year is required.");
      valid = false;
    } else if (isNaN(year) || year < 1800 || year > currentYear) {
      showError(
        "year-error",
        "Enter a valid year between 1800 and " + currentYear + "."
      );
      valid = false;
    }

    const pages = parseInt(pagesValue, 10);
    if (!pagesValue) {
      showError("pages-error", "Pages is required.");
      valid = false;
    } else if (isNaN(pages) || pages <= 0) {
      showError("pages-error", "Pages must be a positive number.");
      valid = false;
    }

    if (!valid) {
      messageElement.textContent = "Please fix the errors above.";
      messageElement.classList.add("error");
      return;
    }

    const payload = {
      title: titleValue,
      author: authorValue,
      publisher: publisherValue,
      year: year,
      pages: pages
    };

    messageElement.textContent = "Saving...";
    fetch(BOOKS_URL + "/" + encodeURIComponent(id), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed to update book");
        }
        return response.json();
      })
      .then(function () {
        messageElement.textContent =
          "Book updated successfully. Redirecting to homepage...";
        messageElement.classList.add("success");
        setTimeout(function () {
          window.location.href = "index.html";
        }, 1200);
      })
      .catch(function () {
        messageElement.textContent = "Error updating book via API.";
        messageElement.classList.add("error");
      });
  });
}

// ----------------- COMMON -----------------

function showError(id, message) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = message;
  }
}

function clearErrors() {
  const ids = [
    "title-error",
    "author-error",
    "publisher-error",
    "year-error",
    "pages-error"
  ];
  ids.forEach(function (id) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = "";
    }
  });
}
