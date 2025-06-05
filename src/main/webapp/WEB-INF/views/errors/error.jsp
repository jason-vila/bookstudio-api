<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%
	String code = request.getAttribute("javax.servlet.error.status_code") != null
	? request.getAttribute("javax.servlet.error.status_code").toString()
	: "Error";
	
	String title = "";
	String message = "";

  switch(code) {
    case "400":
      title = "Solicitud no válida";
      message = "La solicitud no pudo ser procesada. Revisa los datos e intenta nuevamente.";
      break;
    case "401":
      title = "Sesión no iniciada";
      message = "Debes iniciar sesión para acceder a este recurso. Por favor, autentícate.";
      break;
    case "403":
      title = "Acceso no autorizado";
      message = "No tienes permiso para acceder a esta página o recurso.";
      break;
    case "404":
      title = "¡Vaya! Página no encontrada";
      message = "Lo sentimos, la página no existe o fue movida.";
      break;
    case "405":
      title = "Método no permitido";
      message = "La operación solicitada no es válida para este recurso.";
      break;
    case "500":
      title = "Error en el servidor";
      message = "Ocurrió un problema inesperado. Estamos trabajando para solucionarlo.";
      break;
    case "503":
      title = "Servicio en mantenimiento";
      message = "El sistema está temporalmente fuera de servicio. Intenta nuevamente más tarde.";
      break;
    default:
      title = "Error inesperado";
      message = "Algo salió mal. Por favor, intenta más tarde o contacta con soporte.";
      break;
  }
%>

<!DOCTYPE html>
<html lang="es" data-bs-theme="auto">
<head>
	<meta charset="UTF-8">
	<meta name="description" content="BookStudio es un sistema de biblioteca para gestionar préstamos, libros, autores y otros recursos, facilitando la administración y seguimiento de los préstamos.">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<script src="${pageContext.request.contextPath}/js/setup/color-modes.js"></script>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
	<link rel="stylesheet" href="${pageContext.request.contextPath}/css/views/auth.css">
	<title>BookStudio</title>
	<link href="${pageContext.request.contextPath}/images/logo-dark.png" rel="icon" media="(prefers-color-scheme: light)">
	<link href="${pageContext.request.contextPath}/images/logo-light.png" rel="icon" media="(prefers-color-scheme: dark)">
</head>
<body>
	<main class="bg-body-secondary">
		<section class="d-flex align-items-center justify-content-center min-vh-100 px-2">
			<div class="text-center" role="alert" aria-live="assertive">
				<header>
					<h1 class="error-code fw-bold text-body-emphasis"><%= code %></h1>
				</header>
				<h2 class="fs-2 fw-bold mt-4 text-body-emphasis"><%= title %></h2>
				<p class="mt-4 mb-4 text-muted">
					<%= message %>
				</p>
				<div class="d-flex justify-content-center gap-2">
					<button onclick="window.history.back()" class="btn btn-custom-secondary">
						Volver
					</button>
					<a href="${pageContext.request.contextPath}/" class="btn btn-custom-primary text-decoration-none">
						Ir al inicio
					</a>
				</div>
				<div class="position-absolute bottom-0 start-50 translate-middle-x mb-2 d-flex flex-sm-nowrap flex-wrap align-items-center justify-content-center text-center mb-4">
					<span class="text-muted small me-2 text-nowrap">Desarrollado por</span>
					<span class="d-inline-flex align-items-center text-nowrap">
						<img class="logo me-1" alt="Logo de Bookstudio" src="${pageContext.request.contextPath}/images/logo-light.png" width="18">
						<span class="fs-6 text-logo align-middle text-body-emphasis">BookStudio</span>
					</span>
				</div>
			</div>
		</section>
	</main>
</body>
</html>