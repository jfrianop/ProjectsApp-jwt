const appendProject = project => {
  $("#projects table tbody").append(`
    <tr>
      <td>${project.name}</td>
      <td>${project.description}</td>
      <td>${project.creationDate}</td>
      <td><button class="show-issues" projectId=${project._id}>Ver</button></td>
    </tr>
  `);
}

const appendIssue = issue => {
  $("#issues table tbody").append(`
    <tr>
      <td>${issue.name}</td>
      <td>${issue.description}</td>
      <td>${issue.creationDate}</td>
      <td><button class="delete-issue" issueId=${issue._id}>Borrar</button></td>
    </tr>
  `);
}

//Get a cookie by name
const getCookie = (cname) => {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

//Delete a cookie by name
const deleteCookie = (cname) => {
  document.cookie = cname + '=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

//Cargar los proyectos
const loadProjects = () => {
  const token = JSON.parse(window.localStorage.getItem('token'));
  $.ajax({
    method: "GET",
    url: "/projects",
    contentType: "application/json",
    headers: { "Authorization": token },
  }).done(projects => {
    projects.forEach(project => appendProject(project));

  }).fail(err => {
    // si es un err.status 401 mostar el formulario de login
    console.log("Error", err)
  });
}

//Cargar los issues de un proyecto específico
const loadIssues = (projectId) => {
  const token = JSON.parse(window.localStorage.getItem('token'));
  $.ajax({
    method: "GET",
    url: "/projects/" + projectId + "/issues",
    contentType: "application/json",
    headers: { "Authorization": token },
  }).done(issues => {
    issues.forEach(issue => appendIssue(issue));

  }).fail(err => {
    // si es un err.status 401 mostar el formulario de login
    console.log("Error", err)
  });
}

//On Document Ready
$(document).ready(() => {
  $("#register").hide();
  $("#issues").hide();
  if (getCookie("express:sess").length == 0) {
    $("#login").show();
    $("#projects").hide();

  } else {
    $("#login").hide();
    $("#projects").show();
    $("tbody").html("");
    loadProjects();
  }
})

//Logout
$(".logout").on("click", () => {
  deleteCookie("express:sess");
  deleteCookie("express:sess.sig");
  $("#login").show();
  $("#projects").hide();
})

//Open Registration
$(".show-register").on("click", () => {
  $("#register").show();
  $("#login").hide();
})

//Open Login
$(".show-login").on("click", () => {
  $("#login").show();
  $("#register").hide();
})

//Register User Submit
$(".register").on("submit", e => {
  e.preventDefault();

  // limpiar los errores
  $("span.error").remove();

  const email = $(".register #email").val();
  const password = $(".register #password").val();

  $.ajax({
    method: "POST",
    url: "/register",
    contentType: "application/json",
    data: JSON.stringify({ email, password })
  }).done((token) => {
    window.localStorage.setItem("token", JSON.stringify(token));
    $("#login").show();
    $("#register").hide();
    $(".register #email").val("");
    $(".register #password").val("");
  }).fail(err => {
    if (err.status === 422) {
      const errors = err.responseJSON.errors;
      if (errors.email) {
        $(`<span class="error">${errors.email.message}</span>`).insertAfter(".register #email");
      }
      if (errors.password) {
        $(`<span class="error">${errors.password.message}</span>`).insertAfter(".register #password");
      }
    } else {
      console.log("Error: ", err);
    }
  });
});

//Login Submit
$(".login").on("submit", e => {
  e.preventDefault();

  // limpiar los errores
  $("span.error").remove();

  const email = $(".login #email").val();
  const password = $(".login #password").val();

  $.ajax({
    method: "POST",
    url: "/login",
    contentType: "application/json",
    data: JSON.stringify({ email, password })
  }).done(token => {
    window.localStorage.setItem("token", JSON.stringify(token));
    // appendProject(login);
    $("#login").hide();
    $("#projects").show();
    $("tbody").html("");
    loadProjects();
    $(".login #email").val("");
    $(".login #password").val("");
  }).fail(err => {
    if (err.status === 422) {
      const errors = err.responseJSON.errors;
      if (errors.email) {
        $(`<span class="error">${errors.email.message}</span>`).insertAfter(".login #email");
      }
      if (errors.password) {
        $(`<span class="error">${errors.password.message}</span>`).insertAfter(".login #password");
      }
    } else if (err.status === 401) {
      alert(err.responseJSON.error)
    } else {
      console.log("Error: ", err);
    }
  });
});

//Project Submit
$(".projects").on("submit", e => {
  e.preventDefault();
  // limpiar los errores
  $("span.error").remove();

  const name = $(".projects #name").val();
  const description = $(".projects #description").val();
  const token = JSON.parse(window.localStorage.getItem('token'));
  const data = JSON.stringify({ name, description });
  $.ajax({
    method: "POST",
    url: "/projects",
    contentType: "application/json",
    headers: { "Authorization": token },
    data
  }).done(project => {
    appendProject(project);

    $(".projects #name").val("");
    $(".projects #description").val("");
  }).fail(err => {
    if (err.status === 422) {
      const errors = err.responseJSON.errors;
      if (errors.name) {
        $(`<span class="error">${errors.name.message}</span>`).insertAfter(".projects #name");
      }
    } else {
      console.log("Error: ", err);
    }
  });
});

//Load issues from table
$("tbody").on("click", ".show-issues", (e) => {
  $("#projects").hide();
  $("#issues").show();
  $("#issues table tbody").html("");
  const projectId = $(e.currentTarget).attr("projectid");
  $(".issues").attr("projectid", projectId)
  loadIssues(projectId);
})

//Return to project list
$(".back-to-projects").on("click", () => {
  $("#projects").show();
  $("#issues").hide();
})

//Issue Submit
$(".issues").on("submit", e => {
  const projectId = $(e.currentTarget).attr("projectid");
  e.preventDefault();
  // limpiar los errores
  $("span.error").remove();

  const name = $(".issues #name").val();
  const description = $(".issues #description").val();
  const token = JSON.parse(window.localStorage.getItem('token'));
  const data = JSON.stringify({ name, description });
  $.ajax({
    method: "POST",
    url: "/projects/" + projectId + "/issues",
    contentType: "application/json",
    headers: { "Authorization": token },
    data
  }).done(issue => {
    appendIssue(issue);

    $(".issues #name").val("");
    $(".issues #description").val("");
  }).fail(err => {
    if (err.status === 422) {
      const errors = err.responseJSON.errors;
      if (errors.name) {
        $(`<span class="error">${errors.name.message}</span>`).insertAfter(".issues #name");
      }
    } else {
      console.log("Error: ", err);
    }
  });
});

//Delete an Issue

$("tbody").on("click", ".delete-issue", (e) => {
  const projectId = $(".issues").attr("projectid");
  const issueId = $(e.currentTarget).attr("issueId");
  const token = JSON.parse(window.localStorage.getItem('token'));

  $.ajax({
    method: "DELETE",
    url: "/projects/" + projectId + "/issues/" + issueId,
    contentType: "application/json",
    headers: { "Authorization": token }
  }).done(() => {
    $("#issues table tbody").html("");
    loadIssues(projectId);
  }).fail(err => {
    if (err.status === 422) {
      const errors = err.responseJSON.errors;
    } else {
      console.log("Error: ", err);
    }
  });
})