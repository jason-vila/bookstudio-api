/**
 * books.js
 * 
 * Manages the initialization, data loading, and configuration of the books table,  
 * as well as handling modals for creating, viewing, and editing book details.
 * Also supports logical delete (status change) operations on book records.
 * Utilizes AJAX for CRUD operations on book data.
 * Includes functions to manage UI elements like placeholders, dropdown styles, and tooltips.
 * Additionally, incorporates functionality to generate PDFs and Excel files directly from the datatable.
 * 
 * @author [Jason]
 */

/*****************************************
 * GLOBAL VARIABLES AND HELPER FUNCTIONS
 *****************************************/

// Global list of authors, publishers, courses, and genres for the selectpickers
var authorList = [];
var publisherList = [];
var courseList = [];
var genreList = [];

function populateSelect(selector, dataList, valueKey, textKey) {
	var select = $(selector).selectpicker('destroy').empty();
	dataList.forEach(item => {
		if (item[valueKey]) {
			select.append(
				$('<option>', {
					value: item[valueKey],
					text: item[textKey]
				})
			);
		}
	});
}

function populateSelectOptions() {
	$.ajax({
		url: 'BookServlet',
		type: 'GET',
		data: { type: 'populateSelects' },
		dataType: 'json',
		success: function(data, xhr) {
			if (xhr.status === 204) {
				console.warn("No data found for select options.");
				return;
			}
			
			if (data) {
				authorList = data.authors;
				publisherList = data.publishers;
				courseList = data.courses;
				genreList = data.genres;

				populateSelect('#addBookAuthor', authorList, 'authorId', 'name');
				populateSelect('#addBookPublisher', publisherList, 'publisherId', 'name');
				populateSelect('#addBookCourse', courseList, 'courseId', 'name');
				populateSelect('#addBookGenre', genreList, 'genreId', 'genreName');

				populateSelect('#editBookAuthor', authorList, 'authorId', 'name');
				populateSelect('#editBookPublisher', publisherList, 'publisherId', 'name');
				populateSelect('#editBookCourse', courseList, 'courseId', 'name');
				populateSelect('#editBookGenre', genreList, 'genreId', 'genreName');
			}
		},
		error: function(xhr) {
			let errorResponse;
			try {
				errorResponse = JSON.parse(xhr.responseText);
				console.error(`Error fetching select options (${errorResponse.errorType} - ${xhr.status}):`, errorResponse.message);
			} catch (e) {
				console.error("Unexpected error:", xhr.status, xhr.responseText);
			}
		}
	});
}

function placeholderColorSelect() {
	$('select.selectpicker').on('change', function() {
		var $select = $(this);
		var $dropdown = $select.closest('.bootstrap-select');
		var $filterOption = $dropdown.find('.filter-option-inner-inner');

		if ($select.val() !== "" && $select.val() !== null) {
			$dropdown.removeClass('placeholder-color');
			$filterOption.css('color', 'var(--bs-body-color)');
		}
	});
}

function placeholderColorEditSelect() {
	$('select[id^="edit"]').each(function() {
		var $select = $(this);
		var $dropdown = $select.closest('.bootstrap-select');
		var $filterOption = $dropdown.find('.filter-option-inner-inner');

		if ($filterOption.text().trim() === "No hay selección") {
			$filterOption.css('color', 'var(--placeholder-color)');
		} else {
			$filterOption.css('color', 'var(--bs-body-color)');
		}
	});
}

function placeholderColorDateInput() {
	$('input[type="date"]').each(function() {
		var $input = $(this);

		if (!$input.val()) {
			$input.css('color', 'var(--placeholder-color)');
		} else {
			$input.css('color', '');
		}
	});

	$('input[type="date"]').on('change input', function() {
		var $input = $(this);

		if (!$input.val()) {
			$input.css('color', 'var(--placeholder-color)');
		} else {
			$input.css('color', '');
		}
	});
}

/*****************************************
 * TABLE HANDLING
 *****************************************/

function generateRow(book) {
	const userRole = sessionStorage.getItem('userRole');

	return `
		<tr>
			<td class="align-middle text-start">${book.bookId}</td>
			<td class="align-middle text-start">${book.title}</td>
			<td class="align-middle text-center">${book.availableCopies}</td>
			<td class="align-middle text-center">${book.loanedCopies}</td>
			<td class="align-middle text-start">${book.authorName}</td>
			<td class="align-middle text-start">${book.publisherName}</td>
			<td class="align-middle text-center">
				${book.status === 'activo'
					? '<span class="badge text-success-emphasis bg-success-subtle border border-success-subtle p-1">Activo</span>'
					: '<span class="badge text-danger-emphasis bg-danger-subtle border border-danger-subtle p-1">Inactivo</span>'}
			</td>
			<td class="align-middle text-center">
				<div class="d-inline-flex gap-2">
					<button class="btn btn-sm btn-icon-hover" data-tooltip="tooltip" data-bs-placement="top" title="Detalles"
						data-bs-toggle="modal" data-bs-target="#detailsBookModal" data-id="${book.bookId}">
						<i class="bi bi-eye"></i>
					</button>
					${userRole === 'administrador' ?
						`<button class="btn btn-sm btn-icon-hover" data-tooltip="tooltip" data-bs-placement="top" title="Editar"
							data-bs-toggle="modal" data-bs-target="#editBookModal" data-id="${book.bookId}">
							<i class="bi bi-pencil"></i>
						</button>`
					: ''}
				</div>
			</td>
		</tr>
	`;
}

function addRowToTable(book) {
	var table = $('#bookTable').DataTable();
	var rowHtml = generateRow(book);
	var $row = $(rowHtml);

	table.row.add($row).draw();

	initializeTooltips($row);
}

function loadBooks() {
	toggleButtonAndSpinner('loading');

	let safetyTimer = setTimeout(function() {
		toggleButtonAndSpinner('loaded');
		$('#tableContainer').removeClass('d-none');
		$('#cardContainer').removeClass('h-100');
	}, 8000);

	$.ajax({
		url: 'BookServlet',
		type: 'GET',
		data: { type: 'list' },
		dataType: 'json',
		success: function(data) {
			clearTimeout(safetyTimer);

			var tableBody = $('#bodyBooks');
			tableBody.empty();

			if (data && data.length > 0) {
				data.forEach(function(book) {
					var row = generateRow(book);
					tableBody.append(row);
				});

				initializeTooltips(tableBody);
			}

			if ($.fn.DataTable.isDataTable('#bookTable')) {
				$('#bookTable').DataTable().destroy();
			}

			let dataTable = setupDataTable('#bookTable');

			if (data && data.length > 0) {
				$("#generatePDF, #generateExcel").prop("disabled", false);
			} else {
				$("#generatePDF, #generateExcel").prop("disabled", true);
			}

			dataTable.on('draw', function() {
				const filteredCount = dataTable.rows({ search: 'applied' }).count();
				const noDataMessage = $("#authorTable").find("td.dataTables_empty").length > 0;
				$("#generatePDF, #generateExcel").prop("disabled", filteredCount === 0 || noDataMessage);
			});

			$("#generatePDF").off("click").on("click", function() {
				generatePDF(dataTable);
			});

			$("#generateExcel").off("click").on("click", function() {
				generateExcel(dataTable);
			});
		},
		error: function(xhr) {
			let errorResponse;
			try {
				errorResponse = JSON.parse(xhr.responseText);
				console.error(`Error listing book data (${errorResponse.errorType} - ${xhr.status}):`, errorResponse.message);
				showToast('Hubo un error al listar los datos de los libros.', 'error');
			} catch (e) {
				console.error("Unexpected error:", xhr.status, xhr.responseText);
				showToast('Hubo un error inesperado.', 'error');
			}
			
			clearTimeout(safetyTimer);

			var tableBody = $('#bodyBooks');
			tableBody.empty();

			if ($.fn.DataTable.isDataTable('#bookTable')) {
				$('#bookTable').DataTable().destroy();
			}

			setupDataTable('#bookTable');
		}
	});
}

function updateRowInTable(book) {
	var table = $('#bookTable').DataTable();

	var row = table.rows().nodes().to$().filter(function() {
		return $(this).find('td').eq(0).text() === book.bookId.toString();
	});

	if (row.length > 0) {
		row.find('td').eq(1).text(book.title);
		row.find('td').eq(2).text(book.availableCopies);
		row.find('td').eq(3).text(book.loanedCopies);
		row.find('td').eq(4).text(book.authorName);
		row.find('td').eq(5).text(book.publisherName);

		row.find('td').eq(6).html(book.status === 'activo'
			? '<span class="badge text-success-emphasis bg-success-subtle border border-success-subtle p-1">Activo</span>'
			: '<span class="badge text-danger-emphasis bg-danger-subtle border border-danger-subtle p-1">Inactivo</span>');

		table.row(row).invalidate().draw();

		initializeTooltips(row);
	}
}

/*****************************************
 * FORM LOGIC
 *****************************************/

function handleAddBookForm() {
	let isFirstSubmit = true;

	$('#addBookModal').on('hidden.bs.modal', function() {
		isFirstSubmit = true;
		$('#addBookForm').data("submitted", false);
	});

	$('#addBookForm').on('input change', 'input, select', function() {
		if (!isFirstSubmit) {
			validateAddField($(this));
		}
	});

	$('#addBookForm').on('submit', function(event) {
		event.preventDefault();

		if ($(this).data("submitted") === true) {
			return;
		}
		$(this).data("submitted", true);

		if (isFirstSubmit) {
			isFirstSubmit = false;
		}

		var form = $(this)[0];
		var isValid = true;

		$(form).find('input, select').not('.bootstrap-select input[type="search"]').each(function() {
			const field = $(this);
			const valid = validateAddField(field);
			if (!valid) {
				isValid = false;
			}
		});

		if (isValid) {
			var data = $('#addBookForm').serialize() + '&type=create';

			var submitButton = $(this).find('[type="submit"]');
			submitButton.prop('disabled', true);
			$("#addBookSpinner").removeClass("d-none");
			$("#addBookIcon").addClass("d-none");

			$.ajax({
				url: 'BookServlet',
				type: 'POST',
				data: data,
				dataType: 'json',
				success: function(response) {
					if (response && response.success) {
						addRowToTable(response.data);
						$('#addBookModal').modal('hide');
						showToast('Libro agregado exitosamente.', 'success');
					} else {
						console.error(`Backend error (${response.errorType} - ${response.statusCode}):`, response.message);
						$('#addBookModal').modal('hide');
						showToast('Hubo un error al agregar el libro.', 'error');
					}
				},
				error: function(xhr) {
					let errorResponse;
					try {
						errorResponse = JSON.parse(xhr.responseText);
						console.error(`Server error (${errorResponse.errorType} - ${xhr.status}):`, errorResponse.message);
						showToast('Hubo un error al agregar el libro.', 'error');
					} catch (e) {
						console.error("Unexpected error:", xhr.status, xhr.responseText);
						showToast('Hubo un error inesperado.', 'error');
					}
					
					$('#addBookModal').modal('hide');
				},
				complete: function() {
					$("#addBookSpinner").addClass("d-none");
					$("#addBookIcon").removeClass("d-none");
					submitButton.prop('disabled', false);
				}
			});
		} else {
			$(this).data("submitted", false);
		}
	});

	function validateAddField(field) {
		if (field.attr('type') === 'search') {
			return true;
		}

		var errorMessage = 'Este campo es obligatorio.';
		var isValid = true;

		// Default validation
		if (!field.val() || (field[0].checkValidity && !field[0].checkValidity())) {
			field.addClass('is-invalid');
			field.siblings('.invalid-feedback').html(errorMessage);
			isValid = false;
		} else {
			field.removeClass('is-invalid');
		}

		// Title validation
		if (field.is('#addBookTitle')) {
			const title = field.val().trim();

			if (title.length < 3) {
				errorMessage = 'El título debe tener al menos 3 caracteres.';
				isValid = false;
			}
		}

		// Total copies validation
		if (field.is('#addBookTotalCopies')) {
			const copies = parseInt(field.val(), 10);
			const maxCopies = 1000;

			if (copies > maxCopies) {
				errorMessage = `El número máximo de ejemplares es ${maxCopies}.`;
				isValid = false;
			}
		}

		// Release date validation
		if (field.is('#addReleaseDate')) {
			const releaseDate = new Date(field.val());
			const today = new Date();

			if (releaseDate > today) {
				errorMessage = 'La fecha de lanzamiento no puede ser en el futuro.';
				isValid = false;
			}
		}

		// Select validation
		if (field.is('select')) {
			var container = field.closest('.bootstrap-select');
			container.toggleClass('is-invalid', field.hasClass('is-invalid'));
			container.siblings('.invalid-feedback').html(errorMessage);
		}

		if (!isValid) {
			field.addClass('is-invalid');
			field.siblings('.invalid-feedback').html(errorMessage).show();
		} else {
			field.removeClass('is-invalid');
			field.siblings('.invalid-feedback').hide();
		}

		return isValid;
	}
}

function handleEditBookForm() {
	let isFirstSubmit = true;

	$('#editBookModal').on('hidden.bs.modal', function() {
		isFirstSubmit = true;
		$('#editBookForm').data("submitted", false);
	});

	$('#editBookForm').on('input change', 'input, select', function() {
		if (!isFirstSubmit) {
			validateEditField($(this));
		}
	});

	$('#editBookForm').on('submit', function(event) {
		event.preventDefault();

		if ($(this).data("submitted") === true) {
			return;
		}
		$(this).data("submitted", true);

		if (isFirstSubmit) {
			isFirstSubmit = false;
		}

		var form = $(this)[0];
		var isValid = true;

		$(form).find('input, select').not('.bootstrap-select input[type="search"]').each(function() {
			const field = $(this);
			const valid = validateEditField(field);
			if (!valid) {
				isValid = false;
			}
		});

		if (isValid) {
			var data = $(this).serialize() + '&type=update';

			var bookId = $(this).data('bookId');
			if (bookId) {
				data += '&bookId=' + encodeURIComponent(bookId);
			}

			var submitButton = $(this).find('[type="submit"]');
			submitButton.prop('disabled', true);
			$("#editBookSpinner").removeClass("d-none");
			$("#editBookIcon").addClass("d-none");

			$.ajax({
				url: 'BookServlet',
				type: 'POST',
				data: data,
				dataType: 'json',
				success: function(response) {
					if (response && response.success) {
						updateRowInTable(response.data);
						
						$('#editBookModal').modal('hide');
						showToast('Libro actualizado exitosamente.', 'success');
					} else {
						console.error(`Backend error (${response.errorType} - ${response.statusCode}):`, response.message);
						$('#editBookModal').modal('hide');
						showToast('Hubo un error al actualizar el libro.', 'error');
					}
				},
				error: function(xhr) {
					let errorResponse;
					try {
						errorResponse = JSON.parse(xhr.responseText);
						console.error(`Server error (${errorResponse.errorType} - ${xhr.status}):`, errorResponse.message);
						showToast('Hubo un error al actualizar el libro.', 'error');
					} catch (e) {
						console.error("Unexpected error:", xhr.status, xhr.responseText);
						showToast('Hubo un error inesperado.', 'error');
					}
					
					$('#editBookModal').modal('hide');
				},
				complete: function() {
					$("#editBookSpinner").addClass("d-none");
					$("#editBookIcon").removeClass("d-none");
					submitButton.prop('disabled', false);
				}
			});
		} else {
			$(this).data("submitted", false);
		}
	});
}

function validateEditField(field) {
	if (field.attr('type') === 'search') {
		return true;
	}

	var errorMessage = 'Este campo es obligatorio.';
	var isValid = true;

	// Default validation
	if (!field.val() || (field[0].checkValidity && !field[0].checkValidity())) {
		field.addClass('is-invalid');
		field.siblings('.invalid-feedback').html(errorMessage);
		isValid = false;
	} else {
		field.removeClass('is-invalid');
	}

	// Title validation
	if (field.is('#editBookTitle')) {
		const title = field.val().trim();

		if (title.length < 3) {
			errorMessage = 'El título debe tener al menos 3 caracteres.';
			isValid = false;
		}
	}

	// Total copies validation
	if (field.is('#editBookTotalCopies')) {
		const copies = parseInt(field.val(), 10);
		const minCopies = parseInt(field.attr('min'), 10);
		const maxCopies = 1000;

		if (copies < minCopies) {
			errorMessage = `La cantidad mínima de ejemplares para este libro es ${minCopies}.`;
			isValid = false;
		} else if (copies > maxCopies) {
			errorMessage = `El número máximo de ejemplares es ${maxCopies}.`;
			isValid = false;
		}
	}

	// Release date validation
	if (field.is('#editReleaseDate')) {
		const releaseDate = new Date(field.val());
		const today = new Date();

		if (releaseDate > today) {
			errorMessage = 'La fecha de lanzamiento no puede ser en el futuro.';
			isValid = false;
		}
	}

	// Select validation
	if (field.is('select')) {
		var container = field.closest('.bootstrap-select');
		container.toggleClass('is-invalid', field.hasClass('is-invalid'));
		container.siblings('.invalid-feedback').html('Opción seleccionada inactiva o no existente.');
	}

	if (!isValid) {
		field.addClass('is-invalid');
		field.siblings('.invalid-feedback').html(errorMessage).show();
	} else {
		field.removeClass('is-invalid');
		field.siblings('.invalid-feedback').hide();
	}

	return isValid;
}

/*****************************************
 * MODAL MANAGEMENT
 *****************************************/

function loadModalData() {
	// Add Modal
	$(document).on('click', '[data-bs-target="#addBookModal"]', function() {
		populateSelect('#addBookAuthor', authorList, 'authorId', 'name');
		$('#addBookAuthor').selectpicker();

		populateSelect('#addBookPublisher', publisherList, 'publisherId', 'name');
		$('#addBookPublisher').selectpicker();

		populateSelect('#addBookCourse', courseList, 'courseId', 'name');
		$('#addBookCourse').selectpicker();

		populateSelect('#addBookGenre', genreList, 'genreId', 'genreName');
		$('#addBookGenre').selectpicker();

		$('#addBookStatus').selectpicker('destroy').empty().append(
			$('<option>', {
				value: 'activo',
				text: 'Activo'
			}),
			$('<option>', {
				value: 'inactivo',
				text: 'Inactivo'
			})
		);
		$('#addBookStatus').selectpicker();

		$('#addBookForm')[0].reset();
		$('#addBookForm .is-invalid').removeClass('is-invalid');

		placeholderColorDateInput();
	});

	// Details Modal
	$(document).on('click', '[data-bs-target="#detailsBookModal"]', function() {
		var bookId = $(this).data('id');

		$.ajax({
			url: 'BookServlet',
			type: 'GET',
			data: { type: 'details', bookId: bookId },
			dataType: 'json',
			success: function(data) {
				$('#detailsBookID').text(data.bookId);
				$('#detailsBookTitle').text(data.title);
				$('#detailsBookAvaibleCopies').text(data.availableCopies);
				$('#detailsBookLoanedCopies').text(data.loanedCopies);
				$('#detailsBookAuthor').text(data.authorName);
				$('#detailsBookPublisher').text(data.publisherName);
				$('#detailsBookCourse').text(data.courseName);
				$('#detailsReleaseDate').text(moment(data.releaseDate).format('DD/MM/YYYY'));
				$('#detailsBookGenre').text(data.genreName);
				$('#detailsBookStatus').html(
					data.status === 'activo'
						? '<span class="badge text-success-emphasis bg-success-subtle border border-success-subtle p-1">Activo</span>'
						: '<span class="badge text-danger-emphasis bg-danger-subtle border border-danger-subtle p-1">Inactivo</span>'
				);
			},
			error: function(xhr) {
				let errorResponse;
				try {
					errorResponse = JSON.parse(xhr.responseText);
					console.error(`Error loading book details (${errorResponse.errorType} - ${xhr.status}):`, errorResponse.message);
					showToast('Hubo un error al cargar los detalles del libro.', 'error');
				} catch (e) {
					console.error("Unexpected error:", xhr.status, xhr.responseText);
					showToast('Hubo un error inesperado.', 'error');
				}
			}
		});
	});

	// Edit Modal
	$(document).on('click', '[data-bs-target="#editBookModal"]', function() {
		var bookId = $(this).data('id');

		$.ajax({
			url: 'BookServlet',
			type: 'GET',
			data: { type: 'details', bookId: bookId },
			dataType: 'json',
			success: function(data) {
				$('#editBookForm').data('bookId', data.bookId);
				$('#editBookTitle').val(data.title);
				$('#editBookTotalCopies').val(data.totalCopies);
				$('#editBookTotalCopies').attr('min', data.loanedCopies);

				populateSelect('#editBookAuthor', authorList, 'authorId', 'name');
				$('#editBookAuthor').val(data.authorId);
				$('#editBookAuthor').selectpicker();

				populateSelect('#editBookPublisher', publisherList, 'publisherId', 'name');
				$('#editBookPublisher').val(data.publisherId);
				$('#editBookPublisher').selectpicker();

				populateSelect('#editBookCourse', courseList, 'courseId', 'name');
				$('#editBookCourse').val(data.courseId);
				$('#editBookCourse').selectpicker();

				populateSelect('#editBookGenre', genreList, 'genreId', 'genreName');
				$('#editBookGenre').val(data.genreId);
				$('#editBookGenre').selectpicker();

				$('#editReleaseDate').val(moment(data.releaseDate).format('YYYY-MM-DD'));
				$('#editBookStatus').selectpicker('destroy').empty().append(
					$('<option>', {
						value: 'activo',
						text: 'Activo'
					}),
					$('<option>', {
						value: 'inactivo',
						text: 'Inactivo'
					})
				);
				$('#editBookStatus').val(data.status);
				$('#editBookStatus').selectpicker();

				$('#editBookForm .is-invalid').removeClass('is-invalid');

				placeholderColorEditSelect();
				placeholderColorDateInput();

				$('#editBookForm').find('select').each(function() {
					validateEditField($(this), true);
				});
			},
			error: function(xhr) {
				let errorResponse;
				try {
					errorResponse = JSON.parse(xhr.responseText);
					console.error(`Error loading book details for editing (${errorResponse.errorType} - ${xhr.status}):`, errorResponse.message);
					showToast('Hubo un error al cargar los datos del libro.', 'error');
				} catch (e) {
					console.error("Unexpected error:", xhr.status, xhr.responseText);
					showToast('Hubo un error inesperado.', 'error');
				}
			}
		});
	});
}

function setupBootstrapSelectDropdownStyles() {
	const observer = new MutationObserver((mutationsList) => {
		mutationsList.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node.nodeType === 1 && node.classList.contains('dropdown-menu')) {
					const $dropdown = $(node);
					$dropdown.addClass('gap-1 px-2 rounded-3 mx-0 shadow');
					$dropdown.find('.dropdown-item').addClass('rounded-2 d-flex align-items-center justify-content-between');

					$dropdown.find('li:not(:first-child)').addClass('mt-1');

					updateDropdownIcons($dropdown);
				}
			});
		});
	});

	observer.observe(document.body, { childList: true, subtree: true });

	$(document).on('click', '.bootstrap-select .dropdown-item', function() {
		const $dropdown = $(this).closest('.dropdown-menu');
		updateDropdownIcons($dropdown);
	});
}

function setupBootstrapSelectDropdownStyles() {
	const observer = new MutationObserver((mutationsList) => {
		mutationsList.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node.nodeType === 1 && node.classList.contains('dropdown-menu')) {
					const $dropdown = $(node);
					$dropdown.addClass('gap-1 px-2 rounded-3 mx-0 shadow');
					$dropdown.find('.dropdown-item').addClass('rounded-2 d-flex align-items-center justify-content-between'); // Alineación

					$dropdown.find('li:not(:first-child)').addClass('mt-1');

					updateDropdownIcons($dropdown);
				}
			});
		});
	});

	observer.observe(document.body, { childList: true, subtree: true });

	$(document).on('click', '.bootstrap-select .dropdown-item', function() {
		const $dropdown = $(this).closest('.dropdown-menu');
		updateDropdownIcons($dropdown);
	});
}

function updateDropdownIcons($dropdown) {
	$dropdown.find('.dropdown-item').each(function() {
		const $item = $(this);
		let $icon = $item.find('i.bi-check2');

		if ($item.hasClass('active') && $item.hasClass('selected')) {
			if ($icon.length === 0) {
				$('<i class="bi bi-check2 ms-auto"></i>').appendTo($item);
			}
		} else {
			$icon.remove();
		}
	});
}

function initializeTooltips(container) {
	$(container).find('[data-tooltip="tooltip"]').tooltip({
		trigger: 'hover'
	}).on('click', function() {
		$(this).tooltip('hide');
	});
}

function generatePDF(dataTable) {
	const { jsPDF } = window.jspdf;
	const doc = new jsPDF("l", "mm", "a4");
	const logoUrl = '/bookstudio-v1/images/bookstudio-logo-no-bg.png';

	const currentDate = new Date();
	const fecha = currentDate.toLocaleDateString('es-ES', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	});
	const hora = currentDate.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: true
	});

	const pageWidth = doc.internal.pageSize.getWidth();
	const margin = 10;
	const topMargin = 5;

	doc.addImage(logoUrl, 'PNG', margin, topMargin - 5, 30, 30);

	doc.setFont("helvetica", "bold");
	doc.setFontSize(14);
	doc.text("Lista de libros", pageWidth / 2, topMargin + 13, { align: "center" });

	doc.setFont("helvetica", "normal");
	doc.setFontSize(8);
	doc.text(`Fecha: ${fecha}`, pageWidth - margin, topMargin + 10, { align: "right" });
	doc.text(`Hora: ${hora}`, pageWidth - margin, topMargin + 15, { align: "right" });

	const data = dataTable.rows({ search: 'applied' }).nodes().toArray().map(row => {
		let estado = row.cells[6].innerText.trim();
		estado = estado.includes("Activo") ? "Activo" : "Inactivo";

		return [
			row.cells[0].innerText.trim(),
			row.cells[1].innerText.trim(),
			row.cells[2].innerText.trim(),
			row.cells[3].innerText.trim(),
			row.cells[4].innerText.trim(),
			row.cells[5].innerText.trim(),
			estado
		];
	});

	doc.autoTable({
		startY: topMargin + 25,
		margin: { left: margin, right: margin },
		head: [['ID', 'Título', 'Ejemplares disponibles', 'Ejemplares prestados', 'Autor', 'Editorial', 'Estado']],
		body: data,
		theme: 'grid',
		headStyles: {
			fillColor: [0, 0, 0],
			textColor: 255,
			fontStyle: 'bold',
			fontSize: 8,
			halign: 'left'
		},
		bodyStyles: {
			font: "helvetica",
			fontSize: 7,
			halign: 'left'
		},
		didParseCell: function(data) {
			if (data.section === 'body' && data.column.index === 6) {
				data.cell.styles.textColor = data.cell.raw === "Activo"
					? [0, 128, 0]
					: [255, 0, 0];
			}
		}
	});

	const filename = `Lista_de_libros_BookStudio_${fecha.replace(/\//g, '-')}.pdf`;

	const pdfBlob = doc.output('blob');
	const blobUrl = URL.createObjectURL(pdfBlob);
	const link = document.createElement('a');
	link.href = blobUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

function generateExcel(dataTable) {
	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('Libros');

	const currentDate = new Date();
	const dateStr = currentDate.toLocaleDateString('es-ES', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	});
	const timeStr = currentDate.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: true
	});

	worksheet.mergeCells('A1:G1');
	const titleCell = worksheet.getCell('A1');
	titleCell.value = 'Lista de libros - BookStudio';
	titleCell.font = { name: 'Arial', size: 14, bold: true };
	titleCell.alignment = { horizontal: 'center' };

	worksheet.mergeCells('A2:G2');
	const dateTimeCell = worksheet.getCell('A2');
	dateTimeCell.value = `Fecha: ${dateStr}  Hora: ${timeStr}`;
	dateTimeCell.alignment = { horizontal: 'center' };

	worksheet.columns = [
		{ key: 'id', width: 10 },
		{ key: 'titulo', width: 40 },
		{ key: 'disponibles', width: 20 },
		{ key: 'prestados', width: 20 },
		{ key: 'autor', width: 30 },
		{ key: 'editorial', width: 30 },
		{ key: 'estado', width: 15 }
	];

	const headerRow = worksheet.getRow(4);
	headerRow.values = ['ID', 'Título', 'Ejemplares disponibles', 'Ejemplares prestados', 'Autor', 'Editorial', 'Estado'];
	headerRow.eachCell((cell) => {
		cell.font = { bold: true, color: { argb: 'FFFFFF' } };
		cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '000000' } };
		cell.alignment = { horizontal: 'left', vertical: 'middle' };
		cell.border = {
			top: { style: 'thin', color: { argb: 'FFFFFF' } },
			bottom: { style: 'thin', color: { argb: 'FFFFFF' } },
			left: { style: 'thin', color: { argb: 'FFFFFF' } },
			right: { style: 'thin', color: { argb: 'FFFFFF' } }
		};
	});

	const data = dataTable.rows({ search: 'applied' }).nodes().toArray().map(row => {
		let estado = row.cells[6].innerText.trim();
		estado = estado.includes("Activo") ? "Activo" : "Inactivo";

		return {
			id: row.cells[0].innerText.trim(),
			titulo: row.cells[1].innerText.trim(),
			disponibles: row.cells[2].innerText.trim(),
			prestados: row.cells[3].innerText.trim(),
			autor: row.cells[4].innerText.trim(),
			editorial: row.cells[5].innerText.trim(),
			estado: estado
		};
	});

	data.forEach((item) => {
		const row = worksheet.addRow(item);

		const estadoCell = row.getCell(7);
		if (estadoCell.value === "Activo") {
			estadoCell.font = { color: { argb: '008000' } };
			estadoCell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'E6F2E6' }
			};
		} else {
			estadoCell.font = { color: { argb: 'FF0000' } };
			estadoCell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFE6E6' }
			};
		}
	});

	const filename = `Lista_de_libros_BookStudio_${dateStr.replace(/\//g, '-')}.xlsx`;

	workbook.xlsx.writeBuffer().then(buffer => {
		const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = filename;
		link.click();
	});
}

/*****************************************
 * INITIALIZATION
 *****************************************/

$(document).ready(function() {
	loadBooks();
	handleAddBookForm();
	handleEditBookForm();
	loadModalData();
	populateSelectOptions();
	$('.selectpicker').selectpicker();
	setupBootstrapSelectDropdownStyles();
	placeholderColorSelect();
});