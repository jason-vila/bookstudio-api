/**
 * loans.js
 * Manages the initialization, data loading, and configuration of the loans table,  
 * as well as handling modals for creating, viewing, returning, and editing loan details.
 * Utilizes AJAX for CRUD operations on loan data.
 * Includes functions to manage UI elements like placeholders, dropdown styles, and tooltips.
 * Additionally, incorporates functionality to generate PDFs and Excel files directly from the datatable.
 * 
 * @author [Jason]
 */

/*****************************************
 * GLOBAL VARIABLES AND HELPER FUNCTIONS
 *****************************************/

// Global list of books and students for the selectpickers
var bookList = [];
var studentList = [];

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
		url: '/bookstudio/LoanServlet',
		type: 'GET',
		data: { type: 'populateSelects' },
		dataType: 'json',
		success: function(data) {
			if (data) {
				bookList = data.books;
				studentList = data.students;

				populateSelect('#addLoanBook', bookList, 'bookId', 'title');
				populateSelect('#addLoanStudent', studentList, 'studentId', 'firstName');

				populateSelect('#editLoanStudent', studentList, 'studentId', 'firstName');

				$('#addLoanBook').on('change', function() {
					var selectedBookId = $(this).val();
					var selectedBook = bookList.find(book => book.bookId == selectedBookId);

					if (selectedBook) {
						var availableCopies = selectedBook.availableCopies;
						$('#addLoanQuantity').attr('max', availableCopies);
					}
				});

			}
		},
		error: function(status, error) {
			console.error("Error al obtener los datos para los select:", status, error);
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

function updateBookList() {
	$.ajax({
		url: '/bookstudio/LoanServlet',
		type: 'GET',
		data: {
			type: 'populateSelects'
		},
		dataType: 'json',
		success: function(data) {
			if (data) {
				bookList = data.books;
				populateSelect('#addLoanBook', bookList, 'bookId', 'title');
			}
		},
		error: function(status, error) {
			console.error("Error al obtener los datos para los select:", status, error);
		}
	});
}

/*****************************************
 * TABLE HANDLING
 *****************************************/

function generateRow(loan) {
	const userRole = sessionStorage.getItem('userRole');

	return `
		<tr>
			<td class="align-middle text-start">${loan.loanId}</td>
			<td class="align-middle text-start">${loan.bookTitle}</td>
			<td class="align-middle text-start">${loan.studentName}</td>
			<td class="align-middle text-center">${moment(loan.loanDate).format('DD/MM/YYYY')}</td>
			<td class="align-middle text-center">${moment(loan.returnDate).format('DD/MM/YYYY')}</td>
			<td class="align-middle text-center">${loan.quantity}</td>
			<td class="align-middle text-center">
				${loan.status === 'prestado'
					? '<span class="badge text-danger-emphasis bg-danger-subtle border border-danger-subtle p-1">Prestado</span>'
					: '<span class="badge text-success-emphasis bg-success-subtle border border-success-subtle p-1">Devuelto</span>'}
			</td>
			<td class="align-middle text-center">
				<div class="d-inline-flex gap-2">
					<button class="btn btn-sm btn-icon-hover" data-tooltip="tooltip" data-bs-placement="top" title="Detalles"
						data-bs-toggle="modal" data-bs-target="#detailsLoanModal" data-id="${loan.loanId}">
						<i class="bi bi-eye"></i>
					</button>
					${loan.status === 'prestado' ?
						`<button class="btn btn-sm btn-icon-hover" data-tooltip="tooltip" data-bs-placement="top" title="Devolver" 
							data-bs-toggle="modal" data-bs-target="#returnLoanModal" aria-label="Devolver el préstamo"
							data-id="${loan.loanId}" data-status="${loan.status}">
							<i class="bi bi-check2-square"></i>
						</button>`
					: ''}
					${userRole === 'administrador' ?
						`<button class="btn btn-sm btn-icon-hover" data-tooltip="tooltip" data-bs-placement="top" title="Editar"
							data-bs-toggle="modal" data-bs-target="#editLoanModal" data-id="${loan.loanId}">
							<i class="bi bi-pencil"></i>
						</button>`
					: ''}
				</div>
			</td>
		</tr>
	`;
}

function addRowToTable(loan) {
	var table = $('#loanTable').DataTable();
	var rowHtml = generateRow(loan);
	var $row = $(rowHtml);

	table.row.add($row).draw();

	initializeTooltips($row);
}

function loadLoans() {
	toggleButtonAndSpinner('loading');

	let safetyTimer = setTimeout(function() {
		toggleButtonAndSpinner('loaded');
		$('#tableContainer').removeClass('d-none');
		$('#cardContainer').removeClass('h-100');
	}, 8000);

	$.ajax({
		url: '/bookstudio/LoanServlet',
		type: 'GET',
		data: { type: 'list' },
		dataType: 'json',
		success: function(data) {
			clearTimeout(safetyTimer);

			var tableBody = $('#bodyLoans');
			tableBody.empty();

			if (data && data.length > 0) {
				data.forEach(function(loan) {
					var row = generateRow(loan);
					tableBody.append(row);
				});

				initializeTooltips(tableBody);
			}

			if ($.fn.DataTable.isDataTable('#loanTable')) {
				$('#loanTable').DataTable().destroy();
			}

			let dataTable = setupDataTable('#loanTable');

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
		error: function(status, error) {
			clearTimeout(safetyTimer);
			console.error("Error en la solicitud AJAX:", status, error);

			var tableBody = $('#bodyLoans');
			tableBody.empty();

			if ($.fn.DataTable.isDataTable('#loanTable')) {
				$('#loanTable').DataTable().destroy();
			}

			setupDataTable('#loanTable');
		}
	});
}

function updateRowInTable(loan) {
	var table = $('#loanTable').DataTable();

	var row = table.rows().nodes().to$().filter(function() {
		return $(this).find('td').eq(0).text() === loan.loanId.toString();
	});

	if (row.length > 0) {
		row.find('td').eq(1).text(loan.bookTitle);
		row.find('td').eq(2).text(loan.studentName);
		row.find('td').eq(3).text(moment(loan.loanDate).format('DD/MM/YYYY'));
		row.find('td').eq(4).text(moment(loan.returnDate).format('DD/MM/YYYY'));
		row.find('td').eq(5).text(loan.quantity);

		row.find('button[data-status]').data('status', loan.status);

		table.row(row).invalidate().draw();

		initializeTooltips(row);
	}
}

/*****************************************
 * FORM LOGIC
 *****************************************/

function handleAddLoanForm() {
	let isFirstSubmit = true;

	$('#addLoanModal').on('hidden.bs.modal', function() {
		isFirstSubmit = true;
		$('#addLoanForm').data("submitted", false);
	});

	$('#addLoanForm').on('input change', 'input, select', function() {
		if (!isFirstSubmit) {
			validateAddField($(this));
		}
	});

	$('#addLoanForm').on('submit', function(event) {
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
			var data = $('#addLoanForm').serialize() + '&type=create';

			var submitButton = $(this).find('[type="submit"]');
			submitButton.prop('disabled', true);
			$("#addLoanSpinner").removeClass("d-none");
			$("#addLoanIcon").addClass("d-none");

			$.ajax({
				url: '/bookstudio/LoanServlet',
				type: 'POST',
				data: data,
				dataType: 'json',
				success: function(response) {
					console.log(response);
					if (response && response.loanId) {
						addRowToTable(response);
						$('#addLoanModal').modal('hide');
						showToast('Préstamo agregado exitosamente.', 'success');
						generateLoanReceipt(response);
					} else {
						$('#addLoanModal').modal('hide');
						showToast('Hubo un error al agregar el préstamo.', 'error');
					}
				},
				error: function() {
					$('#addLoanModal').modal('hide');
					showToast('Hubo un error al agregar el préstamo.', 'error');
				},
				complete: function() {
					$("#addLoanSpinner").addClass("d-none");
					$("#addLoanIcon").removeClass("d-none");
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

		// Return date validation
		if (field.is('#addReturnDate') && $('#addLoanDate').val()) {
			var loanDate = new Date($('#addLoanDate').val());
			var returnDate = new Date(field.val());

			var maxReturnDate = new Date(loanDate);
			maxReturnDate.setDate(loanDate.getDate() + 14);

			if (returnDate <= loanDate) {
				field.addClass('is-invalid');
				errorMessage = 'La fecha de devolución debe ser posterior de la de préstamo.';
				field.siblings('.invalid-feedback').html(errorMessage);
				isValid = false;
			} else if (returnDate > maxReturnDate) {
				field.addClass('is-invalid');
				errorMessage = 'La fecha de devolución no puede superar los 14 días.';
				field.siblings('.invalid-feedback').html(errorMessage);
				isValid = false;
			}
		}

		// Quantity validation
		if (field.is('#addLoanQuantity')) {
			let quantity = parseInt(field.val(), 10);
			let maxQuantity = parseInt(field.attr('max'), 10);

			if (quantity > maxQuantity) {
				if (maxQuantity === 1) {
					errorMessage = `Solo hay ${maxQuantity} ejemplar disponible para este libro.`;
				} else {
					errorMessage = `Solo hay ${maxQuantity} ejemplares disponibles para este libro.`;
				}
				field.addClass('is-invalid');
				field.siblings('.invalid-feedback').html(errorMessage);
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

function handleEditLoanForm() {
	let isFirstSubmit = true;

	$('#editLoanModal').on('hidden.bs.modal', function() {
		isFirstSubmit = true;
		$('#editLoanForm').data("submitted", false);
	});

	$('#editLoanForm').on('input change', 'input, select', function() {
		if (!isFirstSubmit) {
			validateEditField($(this));
		}
	});

	$('#editLoanForm').on('submit', function(event) {
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
			if (field.attr('id') !== 'editLoanQuantity') {
				const valid = validateEditField(field);
				if (!valid) {
					isValid = false;
				}
			}
		});

		if (isValid) {
			var data = $(this).serialize() + '&type=update';

			var loanId = $(this).data('loanId');
			if (loanId) {
				data += '&loanId=' + encodeURIComponent(loanId);
			}

			var bookId = $(this).data('bookId');
			if (bookId) {
				data += '&bookId=' + encodeURIComponent(bookId);
			}

			var submitButton = $(this).find('[type="submit"]');
			submitButton.prop('disabled', true);
			$("#editLoanSpinner").removeClass("d-none");
			$("#editLoanIcon").addClass("d-none");

			$.ajax({
				url: '/bookstudio/LoanServlet',
				type: 'POST',
				data: data,
				dataType: 'json',
				success: function(response) {
					if (response.success) {
						updateRowInTable(response.data);

						$('#editLoanModal').modal('hide');
						showToast('Préstamo actualizado exitosamente.', 'success');
					} else {
						$('#editLoanModal').modal('hide');
						showToast('Hubo un error al actualizar el préstamo.', 'error');
					}
				},
				error: function() {
					$('#editLoanModal').modal('hide');
					showToast('Hubo un error al actualizar el préstamo.', 'error');
				},
				complete: function() {
					$("#editLoanSpinner").addClass("d-none");
					$("#editLoanIcon").removeClass("d-none");
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

	// Return date validation
	if (field.is('#editReturnDate') && $('#editLoanDate').val()) {
		var loanDate = new Date($('#editLoanDate').val());
		var returnDate = new Date(field.val());

		var maxReturnDate = new Date(loanDate);
		maxReturnDate.setDate(loanDate.getDate() + 14);

		if (returnDate <= loanDate) {
			field.addClass('is-invalid');
			errorMessage = 'La fecha de devolución debe ser posterior de la de préstamo.';
			field.siblings('.invalid-feedback').html(errorMessage);
			isValid = false;
		} else if (returnDate > maxReturnDate) {
			field.addClass('is-invalid');
			errorMessage = 'La fecha de devolución no puede superar los 14 días.';
			field.siblings('.invalid-feedback').html(errorMessage);
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
	$(document).on('click', '[data-bs-target="#addLoanModal"]', function() {
		$.ajax({
			url: '/bookstudio/LoanServlet',
			type: 'GET',
			data: { type: 'populateSelects' },
			dataType: 'json',
			success: function(data) {
				if (data) {
					bookList = data.books;
					studentList = data.students;

					populateSelect('#addLoanBook', bookList, 'bookId', 'title');
					$('#addLoanBook').selectpicker();

					populateSelect('#addLoanStudent', studentList, 'studentId', 'firstName');
					$('#addLoanStudent').selectpicker();

					$('#addLoanForm')[0].reset();
					$('#addLoanForm .is-invalid').removeClass('is-invalid');

					var today = new Date().toISOString().split('T')[0];
					$('#addLoanDate').val(today);

					placeholderColorDateInput();
				}
			},
			error: function(status, error) {
				console.error("Error al obtener los datos para los select:", status, error);
			}
		});
	});

	// Details Modal
	$(document).on('click', '[data-bs-target="#detailsLoanModal"]', function() {
		var loanId = $(this).data('id');

		$.ajax({
			url: '/bookstudio/LoanServlet',
			type: 'GET',
			data: { type: 'details', loanId: loanId },
			dataType: 'json',
			success: function(data) {
				$('#detailsLoanID').text(data.loanId);
				$('#detailsLoanBook').text(data.bookTitle);
				$('#detailsLoanStudent').text(data.studentName);
				$('#detailsLoanDate').text(moment(data.loanDate).format('DD/MM/YYYY'));
				$('#detailsReturnDate').text(moment(data.returnDate).format('DD/MM/YYYY'));
				$('#detailsLoanQuantity').text(data.quantity);
				$('#detailsLoanStatus').html(
					data.status === 'prestado'
						? '<span class="badge bg-danger p-1">Prestado</span>'
						: '<span class="badge bg-success p-1">Devuelto</span>'
				);
				$('#detailsLoanObservation').text(data.observation);
			},
			error: function(status, error) {
				console.log("Error al cargar los detalles del préstamo:", status, error);
			}
		});
	});

	// Return Loan Modal
	$('#returnLoanModal').on('show.bs.modal', function(event) {
		var button = $(event.relatedTarget);
		var loanId = button.data('id');
		var currentStatus = button.data('status');

		if (currentStatus !== 'prestado') {
			$('#returnLoanModal').modal('hide');
			showToast('Este préstamo ya ha sido devuelto.', 'error');
			return;
		}

		var newStatus = 'devuelto';

		$('#modalMessage').html(
			'¿Estás seguro de cambiar el estado a <span class="badge text-success-emphasis bg-success-subtle border border-success-subtle p-1" id="newStatus">Devuelto</span>?'
		);

		$('#confirmReturn').off('click');

		var isSubmitted = false;

		$('#confirmReturn').on('click', function() {
			if (isSubmitted) return;
			isSubmitted = true;

			$('#confirmReturnIcon').addClass('d-none');
			$('#confirmReturnSpinner').removeClass('d-none');
			$('#confirmReturn').prop('disabled', true);

			$.ajax({
				url: '/bookstudio/LoanServlet',
				type: 'POST',
				data: {
					type: 'confirmReturn',
					loanId: loanId,
					newStatus: newStatus
				},
				success: function(response) {
					if (response.success) {
						var table = $('#loanTable').DataTable();
						var row = table.rows().nodes().to$().filter(function() {
							return $(this).find('td').eq(0).text() === loanId.toString();
						});

						if (row.length > 0) {
							var textStatus = newStatus === 'prestado' ? 'Prestado' : 'Devuelto';
							var badgeClass = newStatus === 'prestado'
								? 'text-danger-emphasis bg-danger-subtle border border-danger-subtle'
								: 'text-success-emphasis bg-success-subtle border border-success-subtle';

							row.find('td:eq(6)').html('<span class="badge ' + badgeClass + ' p-1">' + textStatus + '</span>');

							row.find('td:eq(7)').find('.btn[aria-label="Devolver el préstamo"]').hide();

							row.find('button[data-status]').data('status', newStatus);
							table.row(row).invalidate().draw();
						}

						updateBookList();

						$('#returnLoanModal').modal('hide');
						showToast('Préstamo devuelto exitosamente.', 'success');
					} else {
						$('#returnLoanModal').modal('hide');
						showToast('Hubo un error al devolver el préstamo.', 'error');
					}
				},
				error: function() {
					$('#returnLoanModal').modal('hide');
					showToast('Hubo un error al devolver el préstamo.', 'error');
				},
				complete: function() {
					$('#confirmReturnSpinner').addClass('d-none');
					$('#confirmReturnIcon').removeClass('d-none');
					$('#confirmReturn').prop('disabled', false);
				}
			});
		});
	});

	// Edit Modal
	$(document).on('click', '[data-bs-target="#editLoanModal"]', function() {
		var loanId = $(this).data('id');

		$.ajax({
			url: '/bookstudio/LoanServlet',
			type: 'GET',
			data: { type: 'details', loanId: loanId },
			dataType: 'json',
			success: function(data) {
				$('#editLoanForm').data('loanId', data.loanId);
				$('#editLoanForm').data('bookId', data.bookId);

				populateSelect('#editLoanStudent', studentList, 'studentId', 'firstName');
				$('#editLoanStudent').val(data.studentId);
				$('#editLoanStudent').selectpicker();

				$('#editLoanDate').val(moment(data.loanDate).format('YYYY-MM-DD'));
				$('#editReturnDate').val(moment(data.returnDate).format('YYYY-MM-DD'));
				$('#editLoanQuantity').val(data.quantity);
				$('#editloanObservation').val(data.observation);

				$('#editLoanForm .is-invalid').removeClass('is-invalid');

				placeholderColorEditSelect();
				placeholderColorDateInput();

				$('#editLoanForm').find('select').each(function() {
					validateEditField($(this), true);
				});
			},
			error: function(status, error) {
				console.log("Error al cargar los detalles del préstamo para editar:", status, error);
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

function generateLoanReceipt(response) {
	const { jsPDF } = window.jspdf;
	const doc = new jsPDF("p", "mm", [150, 200]);
	const pageWidth = doc.internal.pageSize.getWidth();
	const margin = 10;
	const topMargin = 5;

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

	const logoUrl = '/bookstudio/images/bookstudio-logo-no-bg.png';
	doc.addImage(logoUrl, 'PNG', margin, topMargin - 5, 30, 30);

	doc.setFont("helvetica", "bold");
	doc.setFontSize(14);
	doc.text("Recibo de Préstamo", pageWidth / 2, topMargin + 13, { align: "center" });

	doc.setFont("helvetica", "normal");
	doc.setFontSize(8);
	doc.text(`Fecha: ${fecha}`, pageWidth - margin, topMargin + 10, { align: "right" });
	doc.text(`Hora: ${hora}`, pageWidth - margin, topMargin + 15, { align: "right" });

	const loanDetails = [
		['ID del Préstamo', response.loanId],
		['Libro', response.bookTitle],
		['Estudiante - DNI', response.studentName],
		['Fecha de Préstamo', response.loanDate],
		['Fecha de Devolución', response.returnDate],
		['Cantidad', response.quantity]
	];

	if (response.observation) {
		loanDetails.push(['Observación', response.observation]);
	}

	doc.autoTable({
		startY: topMargin + 25,
		margin: { left: margin, right: margin },
		head: [['Detalle', 'Información']],
		body: loanDetails,
		theme: 'grid',
		headStyles: {
			fillColor: [0, 0, 0],
			textColor: 255,
			fontStyle: 'bold',
			fontSize: 10,
			halign: 'left'
		},
		bodyStyles: {
			font: "helvetica",
			fontSize: 9,
			halign: 'left'
		},
		columnStyles: {
			0: { fontStyle: 'bold', cellWidth: 50 }
		}
	});

	const finalY = doc.previousAutoTable.finalY + 10;
	doc.setFontSize(8);
	doc.setFont("helvetica", "italic");
	doc.text("Este documento es un comprobante del préstamo realizado. Por favor consérvelo hasta la devolución.",
		pageWidth / 2, finalY, { align: "center" });

	const filename = `Recibo_de_Préstamo_BookStudio_${fecha.replace(/\//g, '-')}.pdf`;
	const pdfBlob = doc.output('blob');
	const blobUrl = URL.createObjectURL(pdfBlob);
	const link = document.createElement('a');
	link.href = blobUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

function generatePDF(loanTable) {
	const { jsPDF } = window.jspdf;
	const doc = new jsPDF("l", "mm", "a4");
	const logoUrl = '/bookstudio/images/bookstudio-logo-no-bg.png';

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
	doc.text("Lista de Préstamos", pageWidth / 2, topMargin + 13, { align: "center" });

	doc.setFont("helvetica", "normal");
	doc.setFontSize(8);
	doc.text(`Fecha: ${fecha}`, pageWidth - margin, topMargin + 10, { align: "right" });
	doc.text(`Hora: ${hora}`, pageWidth - margin, topMargin + 15, { align: "right" });

	const data = loanTable.rows({ search: 'applied' }).nodes().toArray().map(row => {
		let estado = row.cells[6].innerText.trim();
		estado = estado.includes("Devuelto") ? "Devuelto" : "Prestado";

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
		head: [['ID', 'Libro', 'Estudiante', 'Fecha Préstamo', 'Fecha Devolución', 'Cantidad', 'Estado']],
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
				data.cell.styles.textColor = data.cell.raw === "Devuelto"
					? [0, 128, 0]
					: [255, 0, 0];
			}
		}
	});

	const filename = `Lista_de_Préstamos_BookStudio_${fecha.replace(/\//g, '-')}.pdf`;

	doc.save(filename);
}

function generateExcel(loanTable) {
	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('Préstamos');

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
	titleCell.value = 'Lista de Préstamos - BookStudio';
	titleCell.font = { name: 'Arial', size: 14, bold: true };
	titleCell.alignment = { horizontal: 'center' };

	worksheet.mergeCells('A2:G2');
	const dateTimeCell = worksheet.getCell('A2');
	dateTimeCell.value = `Fecha: ${dateStr}  Hora: ${timeStr}`;
	dateTimeCell.alignment = { horizontal: 'center' };

	worksheet.columns = [
		{ key: 'id', width: 10 },
		{ key: 'libro', width: 30 },
		{ key: 'estudiante', width: 30 },
		{ key: 'fecha_prestamo', width: 20 },
		{ key: 'fecha_devolucion', width: 20 },
		{ key: 'cantidad', width: 10 },
		{ key: 'estado', width: 15 }
	];

	const headerRow = worksheet.getRow(4);
	headerRow.values = ['ID', 'Libro', 'Estudiante', 'Fecha Préstamo', 'Fecha Devolución', 'Cantidad', 'Estado'];
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

	const data = loanTable.rows({ search: 'applied' }).nodes().toArray().map(row => {
		let estado = row.cells[6].innerText.trim();
		estado = estado.includes("Devuelto") ? "Devuelto" : "Prestado";

		return {
			id: row.cells[0].innerText.trim(),
			libro: row.cells[1].innerText.trim(),
			estudiante: row.cells[2].innerText.trim(),
			fecha_prestamo: row.cells[3].innerText.trim(),
			fecha_devolucion: row.cells[4].innerText.trim(),
			cantidad: row.cells[5].innerText.trim(),
			estado: estado
		};
	});

	data.forEach((item) => {
		const row = worksheet.addRow(item);
		const estadoCell = row.getCell(7);
		if (estadoCell.value === "Devuelto") {
			estadoCell.font = { color: { argb: '008000' } };
			estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6F2E6' } };
		} else {
			estadoCell.font = { color: { argb: 'FF0000' } };
			estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6' } };
		}
	});

	const filename = `Lista_de_Préstamos_BookStudio_${dateStr.replace(/\//g, '-')}.xlsx`;

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
	loadLoans();
	handleAddLoanForm();
	handleEditLoanForm();
	loadModalData();
	populateSelectOptions();
	$('.selectpicker').selectpicker();
	setupBootstrapSelectDropdownStyles();
	placeholderColorSelect();
});