<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
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
					<h1 class="display-1 fw-bold text-body-emphasis">403</h1>
				</header>
				<h2 class="fs-2 fw-bold mt-4 text-body-emphasis">Acceso no autorizado</h2>
				<p class="mt-4 mb-4 text-muted">
					No tienes permiso para acceder a esta página o recurso.
				</p>
				<div class="d-flex justify-content-center gap-2">
					<button onclick="window.history.back()" class="btn btn-custom-secondary">
						Volver
					</button>
					<a href="${pageContext.request.contextPath}/" class="btn btn-custom-primary text-decoration-none">
						Ir al inicio
					</a>
				</div>
			</div>
		</section>
	</main>
</body>
</html>
